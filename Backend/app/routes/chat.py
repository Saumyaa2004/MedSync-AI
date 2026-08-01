from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.db.models import Patient
from app.agents.orchestrator import medsync_graph
from app.agents.memory_agent.memory_agent import MemoryAgent

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
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    result = medsync_graph.invoke({
        "patient_id": payload.patient_id,
        "message": payload.message,
        "is_emergency": False,
        "intent": None,
        "retrieved_context": None,
        "final_response": None,
    })

    # Save to conversation history via the Memory Agent
    MemoryAgent.save_interaction(
        db, payload.patient_id, payload.message, result["final_response"]
    )

    return ChatResponse(
        response=result["final_response"],
        intent=result.get("intent"),
        is_emergency=result.get("is_emergency", False)
    )