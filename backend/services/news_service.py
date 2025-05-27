from openai import AsyncOpenAI
import os
from typing import Dict, Any, List
from fastapi import HTTPException
import logging
import json
import yaml
from pathlib import Path
from pydantic import BaseModel
from datetime import datetime, timezone
import sqlite3
import asyncio

# Configure logging
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


class NewsItem(BaseModel):
    title: str
    summary: str
    source: str
    url: str
    published_date: str
    effect_on_you: str
    affected_asset_symbol: str | None = None
    impact_on_asset: str | None = None

class NewsResponse(BaseModel):
    news_items: List[NewsItem]
    total_items: int
    last_updated: str

class NewsService:
    def __init__(self):
        logger.info("Initializing NewsService")
        try:
            self.client = AsyncOpenAI(
                api_key=os.getenv("PERPLEXITY_API_KEY"),
                base_url="https://api.perplexity.ai",
            )
            logger.info("AsyncOpenAI client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize AsyncOpenAI client: {str(e)}")
            raise

        self.model = "sonar-pro"

        try:
            db_path = "finsight.db"
            logger.info(f"NewsService is connecting to database at: {os.path.abspath(db_path)}")
            self.conn = sqlite3.connect(db_path, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row # To access columns by name
            logger.info(f"Successfully connected to database at {db_path}")
        except Exception as e:
            logger.error(f"Failed to connect to database: {str(e)}")
            self.conn = None # Allow service to run but log error; or raise

        # Load prompts from YAML
        try:
            config_path = Path(__file__).parent.parent / "config" / "news_service.yaml"
            with open(config_path, "r") as file:
                prompts = yaml.safe_load(file)
                self.system_message = {
                    "role": "system",
                    "content": prompts["news_service"]["system_prompt"],
                }
                self.user_prompt_template = prompts["news_service"][
                    "user_prompt_template"
                ]
            logger.info("Successfully loaded prompts from YAML")
        except Exception as e:
            logger.error(f"Failed to load prompts from YAML: {str(e)}")
            raise
        
        # Cache setup
        self.CACHE_DIR = Path(__file__).parent.parent / "cache"
        # self.CACHE_FILE = self.CACHE_DIR / "news_cache.json" # Removed: Will be user-specific
        try:
            self.CACHE_DIR.mkdir(parents=True, exist_ok=True)
            logger.info(f"Cache directory ensured at: {self.CACHE_DIR}")
        except Exception as e:
            logger.error(f"Failed to create cache directory {self.CACHE_DIR}: {str(e)}")
            # Depending on desired behavior, you might want to raise an error here
            # or allow the service to run without caching if directory creation fails.

    async def _get_tracked_assets(self, user_id: str) -> List[Dict[str, Any]]:
        """Fetch tracked assets for a given user from the database."""
        if not self.conn:
            logger.error("Database connection not available, cannot fetch tracked assets.")
            return []
        try:
            # Run synchronous DB call in a thread pool
            def db_call():
                cursor = self.conn.execute("SELECT symbol, name, price, price_history, movement FROM tracked_assets WHERE user_id = ?", (user_id,))
                fetched_rows = cursor.fetchall()
                assets = []
                for row in fetched_rows:
                    asset_data = {
                        "symbol": row["symbol"], 
                        "name": row["name"],
                        "price": row["price"],
                        "movement": row["movement"]
                    }
                    try:
                        asset_data["price_history"] = json.loads(row["price_history"]) if row["price_history"] else []
                    except json.JSONDecodeError:
                        logger.warning(f"Failed to parse price_history for asset {row['symbol']}. Setting to empty list.")
                        asset_data["price_history"] = []
                    except TypeError: 
                        logger.warning(f"price_history for asset {row['symbol']} is None or not a string. Setting to empty list.")
                        asset_data["price_history"] = []
                    assets.append(asset_data)
                return assets

            loop = asyncio.get_event_loop()
            assets = await loop.run_in_executor(None, db_call)
            
            logger.info(f"Fetched {len(assets)} assets for user_id: {user_id}")
            return assets
        except Exception as e:
            logger.error(f"Error fetching tracked assets for user_id {user_id}: {str(e)}")
            return []

    def _get_cache_file_for_user(self, user_id: str) -> Path:
        return self.CACHE_DIR / f"news_cache_{user_id}.json"

    async def _load_from_cache(self, requested_topics: str, user_id: str) -> Dict[str, Any] | None:
        cache_file = self._get_cache_file_for_user(user_id)
        logger.info(f"Attempting to load news from cache for user \'{user_id}\' from \'{cache_file}\' for topics: {requested_topics}")
        if not cache_file.exists():
            logger.info(f"Cache file \'{cache_file}\' does not exist for user \'{user_id}\'.")
            return None
        try:
            # Run synchronous file I/O in a thread pool
            def file_read():
                with open(cache_file, "r") as f:
                    return json.load(f)
            
            loop = asyncio.get_event_loop()
            cache_content = await loop.run_in_executor(None, file_read)
            
            if not (isinstance(cache_content, dict) and \
                    "news_data" in cache_content and \
                    "topics_cached_for" in cache_content):
                logger.warning(f"Cache file \'{cache_file}\' for user \'{user_id}\' has invalid structure. Ignoring cache.")
                return None

            logger.info(f"Successfully loaded news from cache for user \'{user_id}\' (cached for topics: \'{cache_content.get('topics_cached_for')}\')")
            return cache_content["news_data"]
        except json.JSONDecodeError:
            logger.warning(f"Failed to decode JSON from cache file \'{cache_file}\' for user \'{user_id}\'. Ignoring cache.")
            return None
        except Exception as e:
            logger.error(f"Error loading from cache for user \'{user_id}\' from \'{cache_file}\': {str(e)}")
            return None

    async def _save_to_cache(self, data: Dict[str, Any], topics_for_cache: str, user_id: str):
        cache_file = self._get_cache_file_for_user(user_id)
        logger.info(f"Saving news to cache for user \'{user_id}\' at \'{cache_file}\' for topics: {topics_for_cache}")
        cache_content = {
            "cached_at_iso": datetime.now(timezone.utc).isoformat(),
            "topics_cached_for": topics_for_cache,
            "news_data": data 
        }
        try:
            # Run synchronous file I/O in a thread pool
            def file_write():
                with open(cache_file, "w") as f:
                    json.dump(cache_content, f, indent=4)
            
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, file_write)
            logger.info(f"Successfully saved news to cache for user \'{user_id}\' at {cache_file}.")
        except Exception as e:
            logger.error(f"Error saving to cache for user \'{user_id}\' at \'{cache_file}\': {str(e)}")

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

    def _create_messages(self, topics: str, tracked_assets: List[Dict[str, Any]]) -> list:
        """Create message list with system message, user query, and tracked assets."""
        logger.info(f"Creating messages for topics: {topics}")
        try:
            messages = [self.system_message]
            
            assets_str = "The user is tracking the following assets:\n"
            if tracked_assets:
                for asset in tracked_assets:
                    assets_str += f"- {asset['name']} (Symbol: {asset['symbol']})\n"
            else:
                assets_str += "No specific assets are being tracked by the user.\n"
            
            focus_topics = (
                f"focusing on {topics}"
                if topics
                else "general market movements, company developments, and economic indicators."
            )
            # Modify user_content to include tracked_assets information
            user_content = self.user_prompt_template.format(focus_topics=focus_topics, tracked_assets_info=assets_str)
            
            messages.append({"role": "user", "content": user_content})
            logger.debug(f"Created messages: {json.dumps(messages, indent=2)}")
            return messages
        except Exception as e:
            logger.error(f"Error creating messages: {str(e)}")
            raise

    async def _handle_completion_response(
        self, messages: list, model: str = "sonar-pro"
    ) -> Dict[str, Any]:
        """Handle non-streaming response from the API."""
        logger.info("Handling completion response")
        api_response = None
        try:
            if model == "sonar-pro":
                logger.debug(
                    f"Sending request to API with messages: {json.dumps(messages, indent=2)}, model: {model}"
                )

                print("messages:", messages)
                self.model = "sonar-pro"
                response = await self.client.chat.completions.create(
                    extra_body={
                        "search_domain_filter": [
                            "bloomberg.com",
                            "barrons.com",
                            "fortuneindia.com",
                            "financialexpress.com"
                            
                        ]
                    },
                    model=self.model,
                    messages=messages,
                    response_format={
                        "type": "json_schema",
                        "json_schema": {"schema": NewsResponse.model_json_schema()},
                    },
                )
                logger.info("Successfully received response from API")
                response_dict = response.model_dump(exclude_none=True)
                logger.debug(
                    f"API response dictionary: {json.dumps(response_dict, indent=2)}"
                )

                parsed_json_content = self._extract_valid_json(response_dict)
                print("sonar pro parsed_json_content:", parsed_json_content)
                return parsed_json_content
            else:
                logger.debug(
                    f"Sending request to API with messages: {json.dumps(messages, indent=2)}, model: {model}"
                )
                self.model = "sonar-deep-research"
                api_response = await self.client.chat.completions.create(
                    extra_body={"return_images": True},
                    model=self.model,
                    messages=messages,
                    response_format={
                        "type": "json_schema",
                        "json_schema": {"schema": NewsResponse.model_json_schema()},
                    },
                )
                logger.info("Successfully received response from API")

                api_response_dict = api_response.model_dump(exclude_none=True)
                logger.debug(
                    f"API response dictionary: {json.dumps(api_response_dict, indent=2)}"
                )

                parsed_json_content = self._extract_valid_json(api_response_dict)
                print("deep research parsed_json_content:", parsed_json_content)

                logger.info("Successfully extracted and parsed JSON content.")
                return parsed_json_content

        except ValueError as ve:
            logger.error(f"JSON extraction/parsing error: {str(ve)}")
            raw_content_for_logging = "Could not retrieve raw content for logging."
            try:
                if api_response:
                    raw_content_for_logging = api_response.choices[0].message.content
                elif response:
                    raw_content_for_logging = response.choices[0].message.content
            except Exception:
                pass
            logger.error(
                f"Raw response content that failed parsing: {raw_content_for_logging}"
            )
            raise HTTPException(
                status_code=500,
                detail=f"Invalid or malformed JSON response from Sonar API: {str(ve)}, model: {model}",
            )
        except Exception as e:
            logger.error(f"Error in completion response: {str(e)}")
            raise HTTPException(
                status_code=500, detail=f"Completion error: {str(e)}, model: {model}"
            )

    async def process_news_request(
        self, topics: str, user_id: str, model: str = "sonar-pro", force_reload: bool = False
    ) -> Dict[str, Any]:
        logger.info(
            f"Processing news request for user '{user_id}', topics: '{topics}', model: {model}, force_reload: {force_reload}"
        )

        if not force_reload:
            cached_news_data = await self._load_from_cache(requested_topics=topics, user_id=user_id)
            if cached_news_data:
                try:
                    NewsResponse(**cached_news_data) 
                    logger.info(f"Returning news from cache for user '{user_id}'.")
                    return {"news_data": cached_news_data, "retrieved_from_cache": True}
                except Exception as e: 
                    logger.warning(f"Cached data for user '{user_id}' is not valid NewsResponse structure: {e}. Fetching fresh data.")

        logger.info(f"Cache miss for user '{user_id}', invalid cache, or force_reload=True. Fetching fresh news for topics: {topics}.")
        try:
            tracked_assets = await self._get_tracked_assets(user_id)
            messages = self._create_messages(topics, tracked_assets)
            logger.info(f"Messages created successfully for API call for user '{user_id}'.")

            result = await self._handle_completion_response(messages, model)
            logger.info(f"Successfully received news from API for user '{user_id}'.")
            
            await self._save_to_cache(result, topics_for_cache=topics, user_id=user_id)
            
            return {"news_data": result, "retrieved_from_cache": False}

        except HTTPException: 
            raise 
        except Exception as e:
            logger.error(f"Critical error processing news request for user '{user_id}': {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to process news request for user '{user_id}': {str(e)}")
