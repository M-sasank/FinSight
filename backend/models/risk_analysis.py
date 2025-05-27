from pydantic import BaseModel
from typing import List, Optional
from datetime import date

class PricePoint(BaseModel):
    date: date
    close: float

class RiskFactors(BaseModel):
    volatility_score: float  # 0 to 1, raw metric for volatility
    sector_trend_score: float  # 0 to 1, raw metric for sector performance
    dip_count_last_month: int  # Raw count of price dips
    sentiment_class: str  # Concise classification: "Positive", "Neutral", "Negative", "Positive with caution", etc.

class RiskBreakdown(BaseModel):
    volatility: str  # Brief explanation of volatility patterns (max 2 sentences)
    sector: str  # Brief sector analysis (max 2 sentences)
    sentiment: str  # Brief sentiment analysis (max 2 sentences)

class RiskAnalysisResponse(BaseModel):
    asset_symbol: str
    asset_name: str
    risk_level: str  # "Low", "Moderate", "High"
    factors: RiskFactors  # Raw metrics for quantitative analysis
    risk_breakdown: RiskBreakdown  # Brief qualitative explanations
    confidence: float  # 0 to 1, confidence in the analysis
    recommendation: str  # Concise actionable insight (max 2 sentences) 