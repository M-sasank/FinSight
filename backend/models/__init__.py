# This file makes the 'models' directory a Python package.

from .chat import Message, ChatRequest
from .stock_recommendation import StockRecommendationResponse

__all__ = ['Message', 'ChatRequest', 'StockRecommendationResponse'] 