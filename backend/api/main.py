from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from services.chat_service import ChatService
from services.news_service import NewsService
from services.asset_service import AssetService
from models.asset import AssetCreate, AssetResponse
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
logger.info("Environment variables loaded")

app = FastAPI(
    title="Perplexity Hack API",
    description="Backend API for the Perplexity Hack project",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
logger.info("Initializing services")
chat_service = ChatService()
news_service = NewsService()
asset_service = AssetService(chat_service.conn)
logger.info("All services initialized successfully")

@app.get("/")
async def root():
    logger.info("Root endpoint accessed")
    return {"message": "Welcome to Perplexity Hack API"}

@app.get("/health")
async def health_check():
    logger.info("Health check endpoint accessed")
    return {"status": "healthy"}

@app.post("/chat")
async def chat_completion(type: str, user_query: str, conversation_id: str = None):
    logger.info(f"Chat completion request received - Type: {type}, Conversation ID: {conversation_id}")
    try:
        # Generate a new conversation ID if none provided
        if conversation_id is None:
            conversation_id = str(uuid.uuid4())
            logger.info(f"Generated new conversation ID: {conversation_id}")

        # Extract user content from the last message
        response = chat_service.process_chat_request(
            type, user_query, False, conversation_id
        )
        logger.info(f"Successfully processed chat request for conversation: {conversation_id}")
        return {
            "conversation_id": conversation_id,
            "response": response,
        }
    except Exception as e:
        logger.error(f"Error processing chat request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/history")
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

@app.get("/chat/{chat_id}")
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

@app.delete("/chat/clear")
async def clear_chat_history():
    """Clear all chat history from the database."""
    logger.info("Clearing chat history")
    try:
        success = chat_service.clear_database()
        if success:
            logger.info("Successfully cleared chat history")
            return {"message": "Chat history cleared successfully"}
        else:
            logger.error("Failed to clear chat history")
            raise HTTPException(status_code=500, detail="Failed to clear chat history")
    except Exception as e:
        logger.error(f"Error clearing chat history: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/news")
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

@app.post("/tracker/assets/create", response_model=AssetResponse)
async def create_asset(asset: AssetCreate):
    """Create a new tracked asset."""
    logger.info(f"Creating new asset with symbol: {asset.symbol}")
    return asset_service.create_asset(asset)

@app.get("/tracker/assets/get", response_model=List[AssetResponse])
async def get_assets():
    """Get all tracked assets."""
    logger.info("Fetching all tracked assets")
    return asset_service.get_assets()

@app.delete("/tracker/assets/delete/")
async def delete_asset(asset_id: str):
    """Delete a tracked asset."""
    logger.info(f"Deleting asset with ID: {asset_id}")
    return asset_service.delete_asset(asset_id)
    

