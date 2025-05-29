from openai import AsyncOpenAI
import os
from typing import Dict, Any
from fastapi import HTTPException
import logging
import json
import yaml
from pathlib import Path
from pydantic import BaseModel
from datetime import datetime, timezone
import asyncio
from models.stock_recommendation import StockRecommendationResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class StockRecommendationService:
    def __init__(self):
        logger.info("Initializing StockRecommendationService")
        try:
            self.client = AsyncOpenAI(
                api_key=os.getenv("PERPLEXITY_API_KEY"),
                base_url="https://api.perplexity.ai",
            )
            logger.info("AsyncOpenAI client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AsyncOpenAI client: {str(e)}")
            raise

        self.model = "sonar-deep-research"

        # Load prompts from YAML
        try:
            config_path = Path(__file__).parent.parent / "config" / "stock_recommendation_service.yaml"
            with open(config_path, "r") as file:
                prompts = yaml.safe_load(file)
                self.system_message = {
                    "role": "system",
                    "content": prompts["stock_recommendation_service"]["system_prompt"],
                }
                self.user_prompt_template = prompts["stock_recommendation_service"][
                    "user_prompt_template"
                ]
            logger.info("Successfully loaded prompts from YAML")
        except Exception as e:
            logger.error(f"Failed to load prompts from YAML: {str(e)}")
            raise
        
        # Cache setup
        self.CACHE_DIR = Path(__file__).parent.parent / "cache"
        try:
            self.CACHE_DIR.mkdir(parents=True, exist_ok=True)
            logger.info(f"Cache directory ensured at: {self.CACHE_DIR}")
        except Exception as e:
            logger.error(f"Failed to create cache directory {self.CACHE_DIR}: {str(e)}")

    def _get_cache_file(self, user_id: str, model: str) -> Path:
        return self.CACHE_DIR / f"stock_recommendation_cache_{user_id}_{model}.json"

    async def _load_from_cache(self, user_id: str, model: str) -> Dict[str, Any] | None:
        cache_file = self._get_cache_file(user_id, model)
        logger.info(f"Attempting to load stock recommendation from cache for user '{user_id}' with model '{model}' at '{cache_file}'")
        if not cache_file.exists():
            logger.info(f"Cache file '{cache_file}' does not exist for user '{user_id}' and model '{model}'.")
            return None
        try:
            # Run synchronous file I/O in a thread pool
            def file_read():
                with open(cache_file, "r") as f:
                    return json.load(f)
            
            loop = asyncio.get_event_loop()
            cache_content = await loop.run_in_executor(None, file_read)
            
            if not (isinstance(cache_content, dict) and "recommendation_data" in cache_content and "cached_at_iso" in cache_content and "model" in cache_content):
                logger.warning(f"Cache file '{cache_file}' for user '{user_id}' and model '{model}' has invalid structure. Ignoring cache.")
                return None

            # Verify the cached model matches the requested model
            if cache_content.get("model") != model:
                logger.warning(f"Cache file '{cache_file}' contains data for model '{cache_content.get('model')}' but '{model}' was requested. Ignoring cache.")
                return None

            # Check if cache is less than 6 hours old
            cached_at = datetime.fromisoformat(cache_content["cached_at_iso"])
            now = datetime.now(timezone.utc)
            age_hours = (now - cached_at).total_seconds() / 3600
            
            if age_hours < 6:  # Cache for 6 hours
                logger.info(f"Successfully loaded stock recommendation from cache for user '{user_id}' and model '{model}' (age: {age_hours:.1f} hours)")
                return cache_content["recommendation_data"]
            else:
                logger.info(f"Cache is stale for user '{user_id}' and model '{model}' (age: {age_hours:.1f} hours), will refresh")
                return None

        except json.JSONDecodeError:
            logger.warning(f"Failed to decode JSON from cache file '{cache_file}' for user '{user_id}' and model '{model}'. Ignoring cache.")
            return None
        except Exception as e:
            logger.error(f"Error loading from cache for user '{user_id}' and model '{model}' at '{cache_file}': {str(e)}")
            return None

    async def _save_to_cache(self, data: Dict[str, Any], user_id: str, model: str):
        cache_file = self._get_cache_file(user_id, model)
        logger.info(f"Saving stock recommendation to cache for user '{user_id}' and model '{model}' at '{cache_file}'")
        cache_content = {
            "cached_at_iso": datetime.now(timezone.utc).isoformat(),
            "model": model,
            "recommendation_data": data 
        }
        try:
            # Run synchronous file I/O in a thread pool
            def file_write():
                with open(cache_file, "w") as f:
                    json.dump(cache_content, f, indent=4)
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, file_write)
            logger.info(f"Successfully saved stock recommendation to cache for user '{user_id}' and model '{model}' at {cache_file}.")
        except Exception as e:
            logger.error(f"Error saving to cache for user '{user_id}' and model '{model}' at '{cache_file}': {str(e)}")

    def _extract_valid_json(self, response_dict: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extracts and returns only the valid JSON part from a response dictionary.

        This function assumes that the response has a structure where the valid JSON
        is included in the 'content' field of the first choice's message, after the
        closing "</think>" marker. Any markdown code fences (e.g. ```json) are stripped.

        Parameters:
            response_dict (dict): The full API response as a dictionary.

        Returns:
            dict: The parsed JSON object extracted from the content.

        Raises:
            ValueError: If no valid JSON can be parsed from the content.
        """
        content = ""
        try:
            content = response_dict["choices"][0]["message"]["content"]
        except (KeyError, IndexError, TypeError) as e:
            logger.error(
                f"Could not extract content from response_dict: {response_dict}, error: {e}"
            )
            raise ValueError("Invalid response structure, cannot find content.") from e

        # Find the index of the closing </think> tag.
        marker = "</think>"
        idx = content.rfind(marker)

        json_str_to_parse = ""
        if idx == -1:
            # If marker not found, try parsing the entire content.
            logger.warning(
                "No </think> marker found in content. Attempting to parse entire content."
            )
            json_str_to_parse = content.strip()
        else:
            # Extract the substring after the marker.
            json_str_to_parse = content[idx + len(marker) :].strip()

        # Remove markdown code fence markers if present.
        if json_str_to_parse.startswith("```json"):
            json_str_to_parse = json_str_to_parse[len("```json") :].strip()
        if json_str_to_parse.startswith("```"):
            json_str_to_parse = json_str_to_parse[3:].strip()
        if json_str_to_parse.endswith("```"):
            json_str_to_parse = json_str_to_parse[:-3].strip()

        if not json_str_to_parse:
            logger.error("Extracted JSON string is empty after processing.")
            raise ValueError("Extracted JSON string is empty.")

        try:
            parsed_json = json.loads(json_str_to_parse)
            logger.info("Successfully parsed JSON from content.")
            return parsed_json
        except json.JSONDecodeError as e:
            logger.error(
                f"Failed to parse JSON from string: '{json_str_to_parse}'. Error: {e}"
            )
            raise ValueError("Failed to parse valid JSON from response content") from e

    def _create_messages(self) -> list:
        """Create messages for the API call."""
        return [
            self.system_message,
            {
                "role": "user",
                "content": self.user_prompt_template
            }
        ]

    async def _handle_completion_response(
        self, messages: list, model: str = "sonar-pro"
    ) -> Dict[str, Any]:
        """Handle the completion response from the API."""
        try:
            logger.info(f"Making API call to {model} for stock recommendation")
            
            response = await self.client.chat.completions.create(
                model=model,
                messages=messages,
                response_format={
                    "type": "json_schema",
                    "json_schema": {"schema": StockRecommendationResponse.model_json_schema()}
                }
            )

            response_dict = response.model_dump()
            logger.info("API call completed successfully")

            # Extract and validate JSON
            recommendation_data = self._extract_valid_json(response_dict)
            
            # Validate the response matches our expected schema
            try:
                StockRecommendationResponse(**recommendation_data)
                logger.info("Response validation successful")
            except Exception as e:
                logger.error(f"Response validation failed: {str(e)}")
                raise ValueError(f"Invalid response format: {str(e)}")

            return recommendation_data

        except Exception as e:
            logger.error(f"Error in API completion: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to get stock recommendation: {str(e)}")

    async def get_beginner_stock_recommendation(
        self, user_id: str, model: str = "sonar-pro", force_reload: bool = False
    ) -> Dict[str, Any]:
        """
        Get a beginner-friendly low-risk stock recommendation.
        
        Args:
            user_id (str): The user ID for user-specific caching
            model (str): The model to use for the API call
            force_reload (bool): Whether to force a reload and bypass cache
            
        Returns:
            Dict[str, Any]: Stock recommendation data
        """
        logger.info(f"Processing stock recommendation request for user '{user_id}' with model: {model}, force_reload: {force_reload}")
        
        # Check cache first unless force_reload is True
        if not force_reload:
            cached_data = await self._load_from_cache(user_id, model)
            if cached_data:
                logger.info(f"Returning cached stock recommendation for user '{user_id}'")
                return cached_data

        # Create messages and make API call
        messages = self._create_messages()
        recommendation_data = await self._handle_completion_response(messages, model)
        
        # Save to cache
        await self._save_to_cache(recommendation_data, user_id, model)
        
        logger.info(f"Successfully processed stock recommendation request for user '{user_id}'")
        return recommendation_data 