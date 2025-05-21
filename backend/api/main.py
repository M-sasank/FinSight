from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from models import Message, ChatRequest
from services.chat_service import ChatService
import uuid

# Load environment variables
load_dotenv()

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


@app.get("/")
async def root():
    return {"message": "Welcome to Perplexity Hack API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


@app.post("/chat")
async def chat_completion(type: str, user_query: str, conversation_id: str = None):
    # possible types: chat, newbie
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
