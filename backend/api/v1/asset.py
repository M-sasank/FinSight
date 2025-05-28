from fastapi import APIRouter, Depends
from services.asset_service import AssetService
from services.chat_service import ChatService
from services.risk_analysis_service import RiskAnalysisService
from models.asset import AssetCreate, AssetResponse
from models.risk_analysis import RiskAnalysisResponse
from .auth import get_current_user
from models.user import User as UserModel
from typing import List
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize services
chat_service = ChatService()
asset_service = AssetService(chat_service.conn)
risk_analysis_service = RiskAnalysisService()

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

@router.put("/refresh/{asset_id}", response_model=AssetResponse)
async def refresh_asset(asset_id: str, current_user: UserModel = Depends(get_current_user)):
    """Manually refresh asset details for a specific asset."""
    logger.info(f"Manually refreshing asset with ID: {asset_id}, User ID: {current_user.id}")
    return asset_service.refresh_asset_details(asset_id, current_user.id)

@router.get("/analyze-risk/{asset_symbol}", response_model=RiskAnalysisResponse)
async def analyze_asset_risk(asset_symbol: str, current_user: UserModel = Depends(get_current_user)):
    """
    Analyze risk for a specific asset using price history and news sentiment.
    
    Args:
        asset_symbol (str): The symbol of the asset to analyze
        current_user (UserModel): The authenticated user
        
    Returns:
        RiskAnalysisResponse: Detailed risk analysis including volatility, sentiment, and recommendations
    """
    logger.info(f"Analyzing risk for asset {asset_symbol} for user ID: {current_user.id}")
    return await risk_analysis_service.analyze_asset_risk(asset_symbol)
