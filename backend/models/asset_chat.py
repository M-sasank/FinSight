from pydantic import BaseModel
from typing import Optional

class AssetChatRequest(BaseModel):
    user_query: str
    symbol: str
    conversation_id: Optional[str] = None 