from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os
from dotenv import load_dotenv
from models import Message, ChatRequest

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Perplexity Hack API",
    description="Backend API for the Perplexity Hack project",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Perplexity Hack API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/chat")
async def chat_completion(request: ChatRequest):
    try:
        api_key = os.getenv("PERPLEXITY_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="PERPLEXITY_API_KEY environment variable is not set. Please set it in your .env file."
            )

        # Initialize OpenAI client with Perplexity AI
        client = OpenAI(
            api_key=api_key,
            base_url="https://api.perplexity.ai"
        )

        # Convert Pydantic model to dict for the API
        messages = [msg.model_dump() for msg in request.messages]

        if request.stream:
            # Handle streaming response
            response_stream = client.chat.completions.create(
                model="sonar-pro",
                messages=messages,
                stream=True
            )
            return {"type": "stream", "data": response_stream}
        else:
            # Handle non-streaming response
            response = client.chat.completions.create(
                model="sonar-pro",
                messages=messages
            )
            return {"type": "completion", "data": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 