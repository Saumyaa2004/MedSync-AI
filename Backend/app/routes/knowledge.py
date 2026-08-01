from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.rag_service import answer_from_knowledge_base

router = APIRouter(prefix="/knowledge", tags=["Knowledge Base"])


class AskRequest(BaseModel):
    question: str


class AskResponse(BaseModel):
    answer: str
    sources: list[str]


@router.post("/ask", response_model=AskResponse)
def ask_knowledge_base(payload: AskRequest):
    if not payload.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    result = answer_from_knowledge_base(payload.question)
    return result