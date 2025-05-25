from fastapi import APIRouter, HTTPException
from services.chat_service import ChatService
from models.chat import ChatRequest
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Initialize service
chat_service = ChatService()

@router.post("/send")
async def chat_completion(request: ChatRequest):
    logger.info(f"Chat completion request received - Type: {request.type}, Conversation ID: {request.conversation_id}")
    try:
        # Generate a new conversation ID if none provided
        if request.conversation_id is None:
            request.conversation_id = str(uuid.uuid4())
            logger.info(f"Generated new conversation ID: {request.conversation_id}")

        # Extract user content from the last message
        response = chat_service.process_chat_request(
            request.type, request.user_query, False, request.conversation_id
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
async def get_chat_history():
    """Get a list of all chat conversations."""
    logger.info("Fetching chat history")
    try:
        # Get unique conversations with their first message and metadata
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
                    ORDER BY m2.timestamp ASC 
                    LIMIT 1
                ) as first_message
            FROM messages m1
            GROUP BY conversation_id
            ORDER BY first_message_time DESC
        """)
        
        history = []
        for row in cursor.fetchall():
            history.append({
                "id": row["conversation_id"],
                "title": row["first_message"][:30] + ("..." if len(row["first_message"]) > 30 else ""),
                "timestamp": row["first_message_time"],
                "type": row["type"]
            })
        
        logger.info(f"Successfully retrieved {len(history)} chat conversations")
        return {"history": history}
    except Exception as e:
        logger.error(f"Error fetching chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{chat_id}")
async def get_chat_messages(chat_id: str):
    """Get all messages for a specific chat conversation."""
    logger.info(f"Fetching messages for chat ID: {chat_id}")
    try:
        cursor = chat_service.conn.execute("""
            SELECT id, role, content, timestamp
            FROM messages
            WHERE conversation_id = ?
            ORDER BY timestamp ASC
        """, (chat_id,))
        
        messages = []
        for row in cursor.fetchall():
            messages.append({
                "id": row["id"],
                "text": row["content"],
                "sender": "user" if row["role"] == "user" else "bot",
                "timestamp": row["timestamp"]
            })
        
        logger.info(f"Successfully retrieved {len(messages)} messages for chat ID: {chat_id}")
        return {"messages": messages}
    except Exception as e:
        logger.error(f"Error fetching chat messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/clear")
async def clear_database():
    """Clear all data from the database."""
    logger.info("Clearing database")
    try:
        success = chat_service.clear_database()
        if success:
            logger.info("Successfully cleared database")
            return {"message": "Database cleared successfully"}
        else:
            logger.error("Failed to clear database")
            raise HTTPException(status_code=500, detail="Failed to clear database")
    except Exception as e:
        logger.error(f"Error clearing database: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e)) 