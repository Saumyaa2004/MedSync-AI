from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.services.chat_service import run_chat

router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    patient_id: int
    message: str


class ChatResponse(BaseModel):
    response: str
    intent: str | None
    is_emergency: bool


@router.post("/", response_model=ChatResponse)
def chat(payload: ChatRequest, db: Session = Depends(get_db)):
    # Shared with /voice so both paths go through the Safety + Memory agents
    return ChatResponse(**run_chat(db, payload.patient_id, payload.message))
