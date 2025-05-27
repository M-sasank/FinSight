from fastapi import APIRouter, HTTPException, Depends
from services.chat_service import ChatService
from models.chat import ChatRequest
from .auth import get_current_user
from models.user import User as UserModel
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize service
chat_service = ChatService()

@router.post("/send")
async def chat_completion(request: ChatRequest, current_user: UserModel = Depends(get_current_user)):
    logger.info(f"Chat completion request received - Type: {request.type}, Conversation ID: {request.conversation_id}, User ID: {current_user.id}")
    try:
        if request.conversation_id is None:
            request.conversation_id = str(uuid.uuid4())
            logger.info(f"Generated new conversation ID: {request.conversation_id}")

        # Pass current_user.id to the service method
        response = chat_service.process_chat_request(
            request.type, request.user_query, False, request.conversation_id, current_user.id 
        )
        logger.info(f"Successfully processed chat request for conversation: {request.conversation_id}")
        return {
            "conversation_id": request.conversation_id,
            "response": response,
        }
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/history")
async def get_chat_history(current_user: UserModel = Depends(get_current_user)):
    """Get a list of all chat conversations for the current user."""
    logger.info(f"Fetching chat history for user ID: {current_user.id}")
    try:
        # Ensure the SQL query is user-specific
        cursor = chat_service.conn.execute("""
            SELECT 
                conversation_id,
                MIN(timestamp) as first_message_time,
                type,
                (
                    SELECT content 
                    FROM messages m2 
                    WHERE m2.conversation_id = m1.conversation_id 
                    AND m2.role = 'user'
                    AND m2.user_id = ?  -- Filter by user_id
                    ORDER BY m2.timestamp ASC 
                    LIMIT 1
                ) as first_message
            FROM messages m1
            WHERE m1.user_id = ?  -- Filter by user_id
            GROUP BY conversation_id
            ORDER BY first_message_time DESC
        """, (current_user.id, current_user.id))
        
        history = []
        for row in cursor.fetchall():
            history.append({
                "id": row["conversation_id"],
                "title": row["first_message"][:30] + ("..." if len(row["first_message"]) > 30 else ""),
                "timestamp": row["first_message_time"],
                "type": row["type"]
            })
        
        logger.info(f"Successfully retrieved {len(history)} chat conversations for user ID: {current_user.id}")
        return {"history": history}
    except Exception as e:
        logger.error(f"Error fetching chat history for user ID {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{chat_id}")
async def get_chat_messages(chat_id: str, current_user: UserModel = Depends(get_current_user)):
    """Get all messages for a specific chat conversation for the current user."""
    logger.info(f"Fetching messages for chat ID: {chat_id}, User ID: {current_user.id}")
    try:
        # Ensure the SQL query is user-specific
        cursor = chat_service.conn.execute("""
            SELECT id, role, content, timestamp
            FROM messages
            WHERE conversation_id = ? AND user_id = ? -- Filter by user_id
            ORDER BY timestamp ASC
        """, (chat_id, current_user.id))
        
        messages = []
        for row in cursor.fetchall():
            messages.append({
                "id": row["id"],
                "text": row["content"],
                "sender": "user" if row["role"] == "user" else "bot",
                "timestamp": row["timestamp"]
            })
        
        logger.info(f"Successfully retrieved {len(messages)} messages for chat ID: {chat_id}, User ID: {current_user.id}")
        return {"messages": messages}
    except Exception as e:
        logger.error(f"Error fetching chat messages for chat ID {chat_id}, User ID {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/clear")
async def clear_database(current_user: UserModel = Depends(get_current_user)):
    """Clear all data for the current user from the database."""
    logger.info(f"Clearing database for user ID: {current_user.id}")
    try:
        # Pass user_id to the service method
        success = chat_service.clear_database(user_id=current_user.id)
        if success:
            logger.info(f"Successfully cleared database for user ID: {current_user.id}")
            return {"message": f"Database cleared successfully for user ID: {current_user.id}"}
        else:
            logger.error(f"Failed to clear database for user ID: {current_user.id}")
            raise HTTPException(status_code=500, detail=f"Failed to clear database for user ID: {current_user.id}")
    except Exception as e:
        logger.error(f"Error clearing database for user ID {current_user.id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 