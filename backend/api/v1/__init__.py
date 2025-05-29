from fastapi import APIRouter
from .chat import router as chat_router
from .asset import router as asset_router
from .asset_chat import router as asset_chat_router
from .news import router as news_router
from .auth import router as auth_router
from .stock_recommendation import router as stock_recommendation_router

# Create main router for v1
router = APIRouter(prefix="/api/v1")

# Include all routers
router.include_router(chat_router, prefix="/chat", tags=["chat"])
router.include_router(asset_router, prefix="/tracker/assets", tags=["assets"])
router.include_router(asset_chat_router, prefix="/asset-chat", tags=["asset-chat"])
router.include_router(news_router, prefix="/news", tags=["news"])
router.include_router(auth_router)
router.include_router(stock_recommendation_router, prefix="/stock_recommendation", tags=["stock-recommendation"]) 