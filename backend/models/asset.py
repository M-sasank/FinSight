from pydantic import BaseModel
from datetime import datetime

class AssetCreate(BaseModel):
    symbol: str
    name: str

class AssetResponse(BaseModel):
    id: str
    symbol: str
    name: str
    price: float
    movement: float
    reason: str
    sector: str
    news: str
    created_at: datetime
    last_updated: datetime 