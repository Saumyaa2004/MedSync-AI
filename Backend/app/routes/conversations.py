from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Patient
from app.models.conversation import ConversationCreate, ConversationResponse
from app.agents.memory_agent.memory_agent import MemoryAgent
from app.agents.safety_agent.safety_agent import SafetyAgent

router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.post("/", response_model=ConversationResponse)
def create_conversation(payload: ConversationCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    # Safety check runs FIRST, before any other processing
    safety_check = SafetyAgent.check_for_emergency(payload.query)

    if safety_check["is_emergency"]:
        response_text = safety_check["response"]
    else:
        # Placeholder for now — real routing to RAG/FAQ/etc. comes in Step 10 (LangGraph)
        response_text = payload.response or "Acknowledged."

    conversation = MemoryAgent.save_interaction(
        db, payload.patient_id, payload.query, response_text
    )
    return conversation


@router.get("/{patient_id}/history")
def get_history(patient_id: int, limit: int = 5, db: Session = Depends(get_db)):
    history = MemoryAgent.get_recent_history(db, patient_id, limit)
    formatted = MemoryAgent.format_history_for_prompt(history)
    return {"raw": history, "formatted": formatted}