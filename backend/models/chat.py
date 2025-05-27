from pydantic import BaseModel
from typing import List, Optional

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    type: str
    user_query: str
    conversation_id: Optional[str] = None
    section_name: Optional[str] = None 