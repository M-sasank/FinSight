from fastapi import APIRouter
from services.asset_service import AssetService
from services.chat_service import ChatService
from models.asset import AssetCreate, AssetResponse
from typing import List
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
chat_service = ChatService()
asset_service = AssetService(chat_service.conn)

@router.post("/create", response_model=AssetResponse)
async def create_asset(asset: AssetCreate):
    """Create a new tracked asset."""
    logger.info(f"Creating new asset with symbol: {asset.symbol}")
    return asset_service.create_asset(asset)

@router.get("/get", response_model=List[AssetResponse])
async def get_assets():
    """Get all tracked assets."""
    logger.info("Fetching all tracked assets")
    return asset_service.get_assets()

@router.delete("/delete/")
async def delete_asset(asset_id: str):
    """Delete a tracked asset."""
    logger.info(f"Deleting asset with ID: {asset_id}")
    return asset_service.delete_asset(asset_id) 