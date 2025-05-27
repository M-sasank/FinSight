from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import logging

# Import create_db_and_tables
from database import create_db_and_tables, engine # Added engine
from models.user import Base as UserBase # Import Base from where User model is defined

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create database tables
# This should ideally be called once, perhaps managed by Alembic for migrations in production
UserBase.metadata.create_all(bind=engine) # Create tables defined in User model
# If you have other Bases for other models (like from chat.py if they become SQLAlchemy models),
# you'd call create_all on them too or ensure all models use the same Base.
# create_db_and_tables() # Call the function to create tables

# Load environment variables
load_dotenv()
logger.info("Environment variables loaded")

app = FastAPI(
    title="FinSight API",
    description="Backend API for the FinSight project",
    version="1.0.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include v1 router
from api.v1 import router as v1_router
app.include_router(v1_router)

# @app.get("/")
# async def root():
#     logger.info("Root endpoint accessed")
#     return {"message": "Welcome to FinSight API"}

@app.get("/health")
async def health_check():
    logger.info("Health check endpoint accessed")
    return {"status": "healthy"}
    

