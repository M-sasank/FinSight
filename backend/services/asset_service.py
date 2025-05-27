from datetime import datetime, timezone
import uuid
from fastapi import HTTPException
from models.asset import AssetCreate, AssetResponse
from typing import List, Dict, Any
import logging
from openai import OpenAI
import os
import yaml
from pathlib import Path
import json
from pydantic import BaseModel

class AssetData(BaseModel):
    price: float
    movement: float
    reason: str
    sector: str
    news: str
    price_history: list[float]


# Configure loggingw
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AssetService:
    def __init__(self, db_connection):
        logger.info("Initializing AssetService")
        self.conn = db_connection
        
        # Initialize OpenAI client for Sonar API
        try:
            self.client = OpenAI(
                api_key=os.getenv("PERPLEXITY_API_KEY"),
                base_url="https://api.perplexity.ai",
            )
            self.model = "sonar-pro"
            logger.info("OpenAI client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize OpenAI client: {str(e)}")
            raise

        # Load prompts from YAML
        try:
            config_path = Path(__file__).parent.parent / "config" / "asset_tracking.yaml"
            with open(config_path, 'r') as file:
                prompts = yaml.safe_load(file)
                self.system_message = {
                    "role": "system",
                    "content": prompts['asset_tracking']['system_prompt']
                }
                self.user_prompt_template = prompts['asset_tracking']['user_prompt_template']
            logger.info("Successfully loaded prompts from YAML")
        except Exception as e:
            logger.error(f"Failed to load prompts from YAML: {str(e)}")
            raise

    def _fetch_asset_details(self, symbol: str, name: str) -> Dict[str, Any]:
        """Fetch asset details from Sonar API."""
        logger.info(f"Fetching details for asset: {symbol} ({name})")
        try:
            messages = [
                self.system_message,
                {
                    "role": "user",
                    "content": self.user_prompt_template.format(symbol=symbol, name=name)
                }
            ]

            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                response_format={
                    "type": "json_schema",
                    "json_schema": {"schema": AssetData.model_json_schema()}
                }
            )

            content = response.choices[0].message.content

            try:
                asset_details = json.loads(content)
                logger.info("Response is valid JSON")
            except json.JSONDecodeError as e:
                logger.error(f"Invalid JSON response: {str(e)}")
                logger.error(f"Raw response content: {content}")
                raise HTTPException(status_code=500, detail="Invalid JSON response from Sonar API when fetching asset details")
            
            return asset_details
        
        except Exception as e:
            logger.error(f"Error fetching asset details: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to fetch asset details: {str(e)}")

    def create_asset(self, asset: AssetCreate, user_id: int) -> AssetResponse:
        """Create a new tracked asset for a specific user."""
        logger.info(f"Creating new asset with symbol: {asset.symbol} for user_ID: {user_id}")
        try:
            asset_id = str(uuid.uuid4())
            logger.debug(f"Generated asset ID: {asset_id}")
            
            initial_data = self._fetch_asset_details(asset.symbol, asset.name)
            
            price_history = initial_data["price_history"]
            if not isinstance(price_history, list) or len(price_history) != 6:
                logger.warning(f"Invalid price history format from API. Expected 6 prices, got {len(price_history) if isinstance(price_history, list) else 'non-list'}")
                price_history = [initial_data["price"]] * 6
            
            logger.debug("Storing asset in database")
            cursor = self.conn.execute("""
                INSERT INTO tracked_assets (
                    id, symbol, name, price, movement, reason, sector, news, price_history, created_at, last_updated, user_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                asset_id,
                asset.symbol,
                asset.name,
                initial_data["price"],
                initial_data["movement"],
                initial_data["reason"],
                initial_data["sector"],
                initial_data["news"],
                json.dumps(price_history),
                datetime.now(timezone.utc),
                datetime.now(timezone.utc),
                user_id
            ))
            self.conn.commit()
            logger.info(f"Successfully created asset with ID: {asset_id} for user_ID: {user_id}")
            
            # Return the created asset
            return {
                "id": asset_id,
                "symbol": asset.symbol,
                "name": asset.name,
                **initial_data,
                "created_at": datetime.now(timezone.utc),
                "last_updated": datetime.now(timezone.utc)
            }
        except Exception as e:
            logger.error(f"Error creating asset for user_ID {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def get_assets(self, user_id: int) -> List[AssetResponse]:
        """Get all tracked assets for a specific user."""
        logger.info(f"Fetching all tracked assets for user_ID: {user_id}")
        try:
            cursor = self.conn.execute("""
                SELECT * FROM tracked_assets
                WHERE user_id = ?
                ORDER BY created_at DESC
            """, (user_id,))
            
            assets = []
            for row in cursor.fetchall():
                assets.append({
                    "id": row["id"],
                    "symbol": row["symbol"],
                    "name": row["name"],
                    "price": row["price"],
                    "movement": row["movement"],
                    "reason": row["reason"],
                    "sector": row["sector"],
                    "news": row["news"],
                    "price_history": json.loads(row["price_history"]),
                    "created_at": row["created_at"],
                    "last_updated": row["last_updated"]
                })
            
            logger.info(f"Successfully retrieved {len(assets)} assets for user_ID: {user_id}")
            return assets
        except Exception as e:
            logger.error(f"Error fetching assets for user_ID {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def delete_asset(self, asset_id: str, user_id: int) -> dict:
        """Delete a tracked asset for a specific user."""
        logger.info(f"Deleting asset with ID: {asset_id} for user_ID: {user_id}")
        try:
            cursor = self.conn.execute("""
                DELETE FROM tracked_assets
                WHERE id = ? AND user_id = ?
            """, (asset_id, user_id))
            self.conn.commit()
            
            if cursor.rowcount == 0:
                logger.warning(f"Asset not found with ID: {asset_id} for user_ID: {user_id} or user does not own asset")
                raise HTTPException(status_code=404, detail="Asset not found or not owned by user")
            
            logger.info(f"Successfully deleted asset with ID: {asset_id} for user_ID: {user_id}")
            return {"message": "Asset deleted successfully"}
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error deleting asset for user_ID {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e)) 