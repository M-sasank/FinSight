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
chat_service = ChatService()
news_service = NewsService()
asset_service = AssetService(chat_service.conn)

@app.get("/")
async def root():
    return {"message": "Welcome to Perplexity Hack API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/chat")
async def chat_completion(type: str, user_query: str, conversation_id: str = None):
    # possible types: chat, newbie
    print("Type: ", type)
    print("User query: ", user_query)
    print("Conversation ID: ", conversation_id)
    try:
        # Generate a new conversation ID if none provided
        if conversation_id is None:
            conversation_id = str(uuid.uuid4())

        # Extract user content from the last message
        response = chat_service.process_chat_request(
            type, user_query, False, conversation_id
        )
        return {
            "conversation_id": conversation_id,
            "response": response,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chat/history")
async def get_chat_history():
    """Get a list of all chat conversations."""
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
        
        return {"history": history}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/chat/{chat_id}")
async def get_chat_messages(chat_id: str):
    """Get all messages for a specific chat conversation."""
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
        
        return {"messages": messages}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/chat/clear")
async def clear_chat_history():
    """Clear all chat history from the database."""
    try:
        success = chat_service.clear_database()
        if success:
            return {"message": "Chat history cleared successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to clear chat history")
    except Exception as e:
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
    try:
        response = news_service.process_news_request(topics)
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/tracker/assets/create", response_model=AssetResponse)
async def create_asset(asset: AssetCreate):
    """Create a new tracked asset."""
    return asset_service.create_asset(asset)

@app.get("/tracker/assets/get", response_model=List[AssetResponse])
async def get_assets():
    """Get all tracked assets."""
    return asset_service.get_assets()

@app.delete("/tracker/assets/delete/")
async def delete_asset(asset_id: str):
    """Delete a tracked asset."""
    return asset_service.delete_asset(asset_id)
    

