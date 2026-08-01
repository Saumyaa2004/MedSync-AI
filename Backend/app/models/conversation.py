from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class ConversationCreate(BaseModel):
    patient_id: int
    query: str
    response: Optional[str] = None


class ConversationResponse(BaseModel):
    id: int
    patient_id: int
    query: str
    response: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True