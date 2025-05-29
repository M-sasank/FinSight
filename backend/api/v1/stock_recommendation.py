from fastapi import APIRouter, HTTPException, Depends
from services.stock_recommendation_service import StockRecommendationService
from models.stock_recommendation import StockRecommendationResponse
from .auth import get_current_user
from models.user import User as UserModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize service
stock_recommendation_service = StockRecommendationService()

@router.get("/", response_model=StockRecommendationResponse)
async def get_beginner_stock_recommendation(
    model: str = "sonar-pro", 
    force_reload: bool = False, 
    current_user: UserModel = Depends(get_current_user)
):
    """
    Get a beginner-friendly low-risk stock recommendation.
    
    Args:
        model (str): The model to use for the API call (default: sonar-pro)
        force_reload (bool): Whether to force a reload and bypass cache
        current_user (UserModel): The authenticated user, injected by Depends(get_current_user).
        
    Returns:
        StockRecommendationResponse: A single stock recommendation suitable for beginners
    """
    user_id = str(current_user.id)

    logger.info(f"Processing stock recommendation request for User ID: {user_id}, model: {model}, force_reload: {force_reload}")
    try:
        response = await stock_recommendation_service.get_beginner_stock_recommendation(
            user_id=user_id,
            model=model, 
            force_reload=force_reload
        )
        logger.info(f"Successfully processed stock recommendation request for User ID: {user_id}")
        return StockRecommendationResponse(**response)
    except Exception as e:
        logger.error(f"Error processing stock recommendation request for User ID: {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 