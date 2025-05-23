from fastapi import APIRouter, HTTPException
from services.asset_chat_service import AssetChatService
from models.asset_chat import AssetChatRequest
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize service
asset_chat_service = AssetChatService()

@router.post("/")
async def asset_chat_completion(request: AssetChatRequest):
    logger.info(f"Asset chat completion request received - Symbol: {request.symbol}, Conversation ID: {request.conversation_id}")
    try:
        # Generate a new conversation ID if none provided
        if request.conversation_id is None:
            request.conversation_id = str(uuid.uuid4())
            logger.info(f"Generated new conversation ID: {request.conversation_id}")

        response = asset_chat_service.process_chat_request(
            request.user_query, request.symbol, request.conversation_id
        )
        logger.info(f"Successfully processed asset chat request for conversation: {request.conversation_id}")
        return {
            "conversation_id": request.conversation_id,
            "response": response,
        }
    except Exception as e:
        logger.error(f"Error processing asset chat request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{symbol}/history")
async def get_asset_chat_history(symbol: str):
    """Get chat history for a specific asset."""
    logger.info(f"Fetching chat history for asset: {symbol}")
    try:
        history = asset_chat_service.get_chat_history(symbol)
        logger.info(f"Successfully retrieved {len(history)} conversations for asset: {symbol}")
        return {"history": history}
    except Exception as e:
        logger.error(f"Error fetching asset chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{symbol}/{conversation_id}")
async def get_asset_chat_messages(symbol: str, conversation_id: str):
    """Get all messages for a specific asset chat conversation."""
    logger.info(f"Fetching messages for asset chat - Symbol: {symbol}, Conversation ID: {conversation_id}")
    try:
        messages = asset_chat_service.get_chat_messages(conversation_id, symbol)
        logger.info(f"Successfully retrieved {len(messages)} messages for conversation: {conversation_id}")
        return {"messages": messages}
    except Exception as e:
        logger.error(f"Error fetching asset chat messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/clear")
async def clear_asset_chat_database():
    """Clear all data from the asset chat database."""
    logger.info("Clearing asset chat database")
    try:
        success = asset_chat_service.clear_database()
        if success:
            logger.info("Successfully cleared asset chat database")
            return {"message": "Asset chat database cleared successfully"}
        else:
            logger.error("Failed to clear asset chat database")
            raise HTTPException(status_code=500, detail="Failed to clear asset chat database")
    except Exception as e:
        logger.error(f"Error clearing asset chat database: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 