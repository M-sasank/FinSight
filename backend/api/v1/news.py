from fastapi import APIRouter, HTTPException
from services.news_service import NewsService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize service
news_service = NewsService()

@router.post("/")
async def news_completion(topics: str = ""):
    """
    Fetch latest financial news from the web.
    
    Args:
        topics (str): The topics to focus on
        
    Returns:
        dict: The response from the Sonar Pro model
    """
    logger.info(f"Processing news request for topics: {topics}")
    try:
        response = news_service.process_news_request(topics)
        logger.info("Successfully processed news request")
        return response
    except Exception as e:
        logger.error(f"Error processing news request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 