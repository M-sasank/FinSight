from openai import OpenAI
import os
from typing import Dict, Any, List
from fastapi import HTTPException
import logging
import json
import yaml
from pathlib import Path
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class NewsItem(BaseModel):
    title: str
    summary: str
    source: str
    url: str
    published_date: str

class NewsResponse(BaseModel):
    news_items: List[NewsItem]
    total_items: int
    last_updated: str

class NewsService:
    def __init__(self):
        logger.info("Initializing NewsService")
        try:
            self.client = OpenAI(
                api_key=os.getenv("PERPLEXITY_API_KEY"),
                base_url="https://api.perplexity.ai",
            )
            logger.info("OpenAI client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {str(e)}")
            raise

        self.model = "sonar-pro"
        logger.info(f"Using model: {self.model}")
        
        # Load prompts from YAML
        try:
            config_path = Path(__file__).parent.parent / "config" / "news_service.yaml"
            with open(config_path, 'r') as file:
                prompts = yaml.safe_load(file)
                self.system_message = {
                    "role": "system",
                    "content": prompts['news_service']['system_prompt']
                }
                self.user_prompt_template = prompts['news_service']['user_prompt_template']
            logger.info("Successfully loaded prompts from YAML")
        except Exception as e:
            logger.error(f"Failed to load prompts from YAML: {str(e)}")
            raise

    def _create_messages(self, topics: str) -> list:
        """Create message list with system message and user query."""
        logger.info(f"Creating messages for topics: {topics}")
        try:
            messages = [self.system_message]
            focus_topics = f"focusing on {topics}" if topics else "market movements, company developments, and economic indicators. "
            user_content = self.user_prompt_template.format(focus_topics=focus_topics)
            messages.append({"role": "user", "content": user_content})
            logger.debug(f"Created messages: {json.dumps(messages, indent=2)}")
            return messages
        except Exception as e:
            logger.error(f"Error creating messages: {str(e)}")
            raise

    def _handle_completion_response(self, messages: list) -> str:
        """Handle non-streaming response from the API."""
        logger.info("Handling completion response")
        try:
            logger.debug(f"Sending request to API with messages: {json.dumps(messages, indent=2)}")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                response_format={
                    "type": "json_schema",
                    "json_schema": {"schema": NewsResponse.model_json_schema()}
                }
            )
            logger.info("Successfully received response from API")
            
            # Extract just the content from the response
            content = response.choices[0].message.content
            logger.debug(f"Response content: {content}")
            
            # Validate JSON response
            try:
                json.loads(content)  # Validate JSON format
                logger.info("Response is valid JSON")
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON response: {str(e)}")
                logger.error(f"Raw response content: {content}")
                raise HTTPException(status_code=500, detail="Invalid JSON response from API")
            
            return content
            
        except Exception as e:
            logger.error(f"Error in completion response: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Completion error: {str(e)}")

    def process_news_request(self, topics: str) -> Dict[str, Any]:
        """
        Process the news request and return appropriate response.

        Args:
            topics (str): Optional topics to focus on in the news

        Returns:
            Dict[str, Any]: Response containing completion data with JSON formatted news
        """
        logger.info(f"Processing news request for topics: {topics}")
        try:
            messages = self._create_messages(topics)
            logger.info("Messages created successfully")
            
            result = self._handle_completion_response(messages)
            logger.info("Successfully processed news request")
            return result
            
        except Exception as e:
            logger.error(f"Error processing news request: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e)) 