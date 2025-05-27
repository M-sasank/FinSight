from fastapi import APIRouter, Depends
from services.asset_service import AssetService
from services.chat_service import ChatService
from models.asset import AssetCreate, AssetResponse
from .auth import get_current_user
from models.user import User as UserModel
from typing import List
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
chat_service = ChatService()
asset_service = AssetService(chat_service.conn)

@router.post("/create", response_model=AssetResponse)
async def create_asset(asset: AssetCreate, current_user: UserModel = Depends(get_current_user)):
    """Create a new tracked asset for the current user."""
    logger.info(f"Creating new asset with symbol: {asset.symbol}, User ID: {current_user.id}")
    return asset_service.create_asset(asset, current_user.id)

@router.get("/get", response_model=List[AssetResponse])
async def get_assets(current_user: UserModel = Depends(get_current_user)):
    """Get all tracked assets for the current user."""
    logger.info(f"Fetching all tracked assets for user ID: {current_user.id}")
    return asset_service.get_assets(current_user.id)

@router.delete("/delete/")
async def delete_asset(asset_id: str, current_user: UserModel = Depends(get_current_user)):
    """Delete a tracked asset for the current user."""
    logger.info(f"Deleting asset with ID: {asset_id}, User ID: {current_user.id}")
    return asset_service.delete_asset(asset_id, current_user.id) 