from pydantic import BaseModel
from typing import Optional

class StockRecommendationResponse(BaseModel):
    stock_name: str
    ticker_symbol: str
    current_price: float
    price_change_percent_24h: float
    sector: str
    risk_label: str
    risk_reasoning: str
    recommendation_reason: Optional[str] = None 