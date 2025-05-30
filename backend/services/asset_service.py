from datetime import datetime, timezone, timedelta
import uuid
from fastapi import HTTPException
from models.asset import AssetCreate, AssetResponse
from typing import List, Dict, Any, Optional
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

    def _get_cached_asset_details(self, symbol: str, user_id: int) -> Optional[Dict[str, Any]]:
        """Get cached asset details from the database if they exist and are less than 1 day old."""
        logger.debug(f"Checking cache for asset {symbol} for user {user_id}")
        try:
            cursor = self.conn.execute("""
                SELECT * FROM tracked_assets 
                WHERE symbol = ? AND user_id = ?
                ORDER BY last_updated DESC
                LIMIT 1
            """, (symbol, user_id))
            
            row = cursor.fetchone()
            if not row:
                logger.debug(f"Cache MISS: No cached data found for asset {symbol} for user {user_id}")
                return None
            
            # Check if the data is less than 1 day old
            last_updated = datetime.fromisoformat(row["last_updated"].replace('Z', '+00:00')).replace(tzinfo=timezone.utc)
            now = datetime.now(timezone.utc)
            age_hours = (now - last_updated).total_seconds() / 3600
            
            if (now - last_updated) < timedelta(days=1):
                logger.info(f"Cache HIT: Using cached asset details for {symbol} (age: {age_hours:.1f} hours)")
                return {
                    "id": row["id"],
                    "symbol": row["symbol"],
                    "name": row["name"],
                    "price": row["price"],
                    "movement": row["movement"],
                    "reason": row["reason"],
                    "sector": row["sector"],
                    "news": row["news"],
                    "price_history": json.loads(row["price_history"]) if row["price_history"] else [],
                    "created_at": row["created_at"],
                    "last_updated": row["last_updated"]
                }
            else:
                logger.info(f"Cache MISS: Cached asset details for {symbol} are stale (age: {age_hours:.1f} hours), will refresh")
                return None
                
        except Exception as e:
            logger.error(f"Error getting cached asset details for {symbol}: {str(e)}")
            return None

    def _update_asset_details(self, asset_id: str, asset_details: Dict[str, Any]) -> None:
        """Update existing asset with fresh details from API."""
        try:
            price_history = asset_details["price_history"]
            if not isinstance(price_history, list) or len(price_history) != 6:
                logger.warning(f"Invalid price history format from API. Expected 6 prices, got {len(price_history) if isinstance(price_history, list) else 'non-list'}")
                # Get current price from existing data if price_history is invalid
                cursor = self.conn.execute("SELECT price FROM tracked_assets WHERE id = ?", (asset_id,))
                row = cursor.fetchone()
                current_price = row["price"] if row else asset_details["price"]
                price_history = [current_price] * 6
            
            self.conn.execute("""
                UPDATE tracked_assets 
                SET price = ?, movement = ?, reason = ?, sector = ?, news = ?, 
                    price_history = ?, last_updated = ?
                WHERE id = ?
            """, (
                asset_details["price"],
                asset_details["movement"],
                asset_details["reason"],
                asset_details["sector"],
                asset_details["news"],
                json.dumps(price_history),
                datetime.now(timezone.utc),
                asset_id
            ))
            self.conn.commit()
            logger.info(f"Successfully updated asset details for asset ID: {asset_id}")
            
        except Exception as e:
            logger.error(f"Error updating asset details for asset ID {asset_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Failed to update asset details: {str(e)}")

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
                extra_body={
                        "search_domain_filter": [
                            "tradingview.com",
                        ]
                    },
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
            # First check if we already have this asset for this user
            cached_asset = self._get_cached_asset_details(asset.symbol, user_id)
            
            if cached_asset:
                logger.info(f"Cache HIT: Asset {asset.symbol} already exists for user {user_id} with recent data (last updated: {cached_asset['last_updated']})")
                raise HTTPException(status_code=400, detail=f"Asset {asset.symbol} is already being tracked")
            
            # Check if asset exists but data is old
            cursor = self.conn.execute("""
                SELECT id, last_updated FROM tracked_assets 
                WHERE symbol = ? AND user_id = ?
            """, (asset.symbol, user_id))
            existing_row = cursor.fetchone()
            
            if existing_row:
                # Asset exists but data is old, update it
                logger.info(f"Cache MISS: Asset {asset.symbol} exists but data is stale (last updated: {existing_row['last_updated']}), refreshing with fresh data")
                fresh_data = self._fetch_asset_details(asset.symbol, asset.name)
                self._update_asset_details(existing_row["id"], fresh_data)
                
                # Return updated asset
                updated_cursor = self.conn.execute("""
                    SELECT * FROM tracked_assets WHERE id = ?
                """, (existing_row["id"],))
                updated_row = updated_cursor.fetchone()
                
                logger.info(f"Successfully refreshed cached asset {asset.symbol} for user {user_id}")
                return {
                    "id": updated_row["id"],
                    "symbol": updated_row["symbol"],
                    "name": updated_row["name"],
                    "price": updated_row["price"],
                    "movement": updated_row["movement"],
                    "reason": updated_row["reason"],
                    "sector": updated_row["sector"],
                    "news": updated_row["news"],
                    "price_history": json.loads(updated_row["price_history"]),
                    "created_at": updated_row["created_at"],
                    "last_updated": updated_row["last_updated"]
                }
            
            # Create new asset
            logger.info(f"Cache MISS: Asset {asset.symbol} not found in cache, creating new asset")
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
            logger.info(f"Successfully created new asset with ID: {asset_id} for user_ID: {user_id}")
            
            # Return the created asset
            return {
                "id": asset_id,
                "symbol": asset.symbol,
                "name": asset.name,
                **initial_data,
                "created_at": datetime.now(timezone.utc),
                "last_updated": datetime.now(timezone.utc)
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error creating asset for user_ID {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def get_assets(self, user_id: int) -> List[AssetResponse]:
        """Get all tracked assets for a specific user, refreshing stale data."""
        logger.info(f"Fetching all tracked assets for user_ID: {user_id}")
        try:
            cursor = self.conn.execute("""
                SELECT * FROM tracked_assets
                WHERE user_id = ?
                ORDER BY created_at DESC
            """, (user_id,))
            
            assets = []
            cache_hits = 0
            cache_misses = 0
            
            for row in cursor.fetchall():
                # Check if data is stale (older than 1 day)
                last_updated = datetime.fromisoformat(row["last_updated"].replace('Z', '+00:00')).replace(tzinfo=timezone.utc)
                now = datetime.now(timezone.utc)
                
                if (now - last_updated) >= timedelta(days=1):
                    cache_misses += 1
                    logger.info(f"Cache MISS: Asset {row['symbol']} data is stale (last updated: {last_updated}), refreshing from API")
                    try:
                        fresh_data = self._fetch_asset_details(row["symbol"], row["name"])
                        self._update_asset_details(row["id"], fresh_data)
                        
                        # Get updated row
                        updated_cursor = self.conn.execute("""
                            SELECT * FROM tracked_assets WHERE id = ?
                        """, (row["id"],))
                        row = updated_cursor.fetchone()
                        logger.info(f"Successfully refreshed asset {row['symbol']} from API")
                    except Exception as e:
                        logger.error(f"Failed to refresh data for asset {row['symbol']}: {str(e)}")
                        logger.warning(f"Continuing with stale data for asset {row['symbol']}")
                        # Continue with stale data if refresh fails
                else:
                    cache_hits += 1
                    logger.debug(f"Cache HIT: Asset {row['symbol']} data is fresh (last updated: {last_updated})")
                
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
            
            logger.info(f"Successfully retrieved {len(assets)} assets for user_ID: {user_id} (Cache hits: {cache_hits}, Cache misses: {cache_misses})")
            return assets
        except Exception as e:
            logger.error(f"Error fetching assets for user_ID {user_id}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def refresh_asset_details(self, asset_id: str, user_id: int) -> AssetResponse:
        """Manually refresh asset details for a specific asset."""
        logger.info(f"Manually refreshing asset details for asset ID: {asset_id}")
        try:
            # Get current asset
            cursor = self.conn.execute("""
                SELECT * FROM tracked_assets 
                WHERE id = ? AND user_id = ?
            """, (asset_id, user_id))
            
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=404, detail="Asset not found or not owned by user")
            
            # Fetch fresh data
            fresh_data = self._fetch_asset_details(row["symbol"], row["name"])
            self._update_asset_details(asset_id, fresh_data)
            
            # Return updated asset
            updated_cursor = self.conn.execute("""
                SELECT * FROM tracked_assets WHERE id = ?
            """, (asset_id,))
            updated_row = updated_cursor.fetchone()
            
            return {
                "id": updated_row["id"],
                "symbol": updated_row["symbol"],
                "name": updated_row["name"],
                "price": updated_row["price"],
                "movement": updated_row["movement"],
                "reason": updated_row["reason"],
                "sector": updated_row["sector"],
                "news": updated_row["news"],
                "price_history": json.loads(updated_row["price_history"]),
                "created_at": updated_row["created_at"],
                "last_updated": updated_row["last_updated"]
            }
            
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error refreshing asset details for asset ID {asset_id}: {str(e)}")
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