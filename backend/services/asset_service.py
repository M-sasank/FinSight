from datetime import datetime, timezone
import uuid
from fastapi import HTTPException
from models.asset import AssetCreate, AssetResponse
from typing import List
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class AssetService:
    def __init__(self, db_connection):
        logger.info("Initializing AssetService")
        self.conn = db_connection

    def create_asset(self, asset: AssetCreate) -> AssetResponse:
        """Create a new tracked asset."""
        logger.info(f"Creating new asset with symbol: {asset.symbol}")
        try:
            asset_id = str(uuid.uuid4())
            logger.debug(f"Generated asset ID: {asset_id}")
            
            initial_data = {
                "price": 0.0,  
                "movement": 0.0, 
                "reason": "No reason provided",
                "sector": "Unknown", 
                "news": "No recent news available" 
            }
            
            # Store the asset in the database
            logger.debug("Storing asset in database")
            cursor = self.conn.execute("""
                INSERT INTO tracked_assets (
                    id, symbol, name, price, movement, reason, sector, news, created_at, last_updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                asset_id,
                asset.symbol,
                asset.name,
                initial_data["price"],
                initial_data["movement"],
                initial_data["reason"],
                initial_data["sector"],
                initial_data["news"],
                datetime.now(timezone.utc),
                datetime.now(timezone.utc)
            ))
            self.conn.commit()
            logger.info(f"Successfully created asset with ID: {asset_id}")
            
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
            logger.error(f"Error creating asset: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def get_assets(self) -> List[AssetResponse]:
        """Get all tracked assets."""
        logger.info("Fetching all tracked assets")
        try:
            cursor = self.conn.execute("""
                SELECT * FROM tracked_assets
                ORDER BY created_at DESC
            """)
            
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
                    "created_at": row["created_at"],
                    "last_updated": row["last_updated"]
                })
            
            logger.info(f"Successfully retrieved {len(assets)} assets")
            return assets
        except Exception as e:
            logger.error(f"Error fetching assets: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    def delete_asset(self, asset_id: str) -> dict:
        """Delete a tracked asset."""
        logger.info(f"Deleting asset with ID: {asset_id}")
        try:
            cursor = self.conn.execute("""
                DELETE FROM tracked_assets
                WHERE id = ?
            """, (asset_id,))
            self.conn.commit()
            
            if cursor.rowcount == 0:
                logger.warning(f"Asset not found with ID: {asset_id}")
                raise HTTPException(status_code=404, detail="Asset not found")
            
            logger.info(f"Successfully deleted asset with ID: {asset_id}")
            return {"message": "Asset deleted successfully"}
        except HTTPException as e:
            raise e
        except Exception as e:
            logger.error(f"Error deleting asset: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e)) 