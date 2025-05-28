from fastapi import APIRouter, HTTPException, Depends
from services.news_service import NewsService
from .auth import get_current_user
from models.user import User as UserModel
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize service
news_service = NewsService()

@router.post("/")
async def news_completion(topics: str = "", model: str = "sonar-pro", force_reload: bool = False, current_user: UserModel = Depends(get_current_user)):
    """
    Fetch latest financial news from the web.
    
    Args:
        topics (str): The topics to focus on
        force_reload (bool): Whether to force a reload of the news
        current_user (UserModel): The authenticated user, injected by Depends(get_current_user).
        
    Returns:
        dict: The response from the Sonar Pro model
    """
    # Assuming current_user.id is the unique identifier for the user.
    # If it's email or another field, adjust accordingly and ensure it's a string.
    user_id = str(current_user.id) 

    logger.info(f"Processing news request for User ID: {user_id}, topics: {topics}, model: {model}, force_reload: {force_reload}")
    try:
        response = await news_service.process_news_request(user_id=user_id, topics=topics, model=model, force_reload=force_reload)
        logger.info(f"Successfully processed news request for User ID: {user_id}")
        return response
    except Exception as e:
        logger.error(f"Error processing news request for User ID: {user_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 