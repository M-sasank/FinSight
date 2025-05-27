from fastapi import APIRouter, HTTPException, Depends
from services.asset_chat_service import AssetChatService
from models.asset_chat import AssetChatRequest
from .auth import get_current_user
from models.user import User as UserModel
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize service
asset_chat_service = AssetChatService()

@router.post("/")
async def asset_chat_completion(request: AssetChatRequest, current_user: UserModel = Depends(get_current_user)):
    logger.info(f"Asset chat completion request received - Symbol: {request.symbol}, Conversation ID: {request.conversation_id}, User: {current_user.email}")
    try:
        # Generate a new conversation ID if none provided
        if request.conversation_id is None:
            request.conversation_id = str(uuid.uuid4())
            logger.info(f"Generated new conversation ID: {request.conversation_id}")

        response = await asset_chat_service.process_chat_request(
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
async def get_asset_chat_history(symbol: str, current_user: UserModel = Depends(get_current_user)):
    """Get chat history for a specific asset."""
    logger.info(f"Fetching chat history for asset: {symbol}, User: {current_user.email}")
    try:
        history = await asset_chat_service.get_chat_history(symbol, current_user.id)
        logger.info(f"Successfully retrieved {len(history)} conversations for asset: {symbol}")
        return {"history": history}
    except Exception as e:
        logger.error(f"Error fetching asset chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{symbol}/{conversation_id}")
async def get_asset_chat_messages(symbol: str, conversation_id: str, current_user: UserModel = Depends(get_current_user)):
    """Get all messages for a specific asset chat conversation."""
    logger.info(f"Fetching messages for asset chat - Symbol: {symbol}, Conversation ID: {conversation_id}, User: {current_user.email}")
    try:
        messages = await asset_chat_service.get_chat_messages(conversation_id, symbol, current_user.id)
        logger.info(f"Successfully retrieved {len(messages)} messages for conversation: {conversation_id}")
        return {"messages": messages}
    except Exception as e:
        logger.error(f"Error fetching asset chat messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/clear")
async def clear_asset_chat_database(current_user: UserModel = Depends(get_current_user)):
    """Clear all data from the asset chat database (asset_messages table)."""
    logger.info(f"Clearing asset_messages table via asset_chat_service by user: {current_user.email}")
    try:
        success = await asset_chat_service.clear_database()
        if success:
            logger.info("Successfully cleared asset_messages table")
            return {"message": "Asset chat messages cleared successfully"}
        else:
            logger.error("Failed to clear asset_messages table")
            raise HTTPException(status_code=500, detail="Failed to clear asset chat messages")
    except Exception as e:
        logger.error(f"Error clearing asset_messages table: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 