from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.db.models import Patient
from app.agents.orchestrator import medsync_graph
from app.agents.memory_agent.memory_agent import MemoryAgent


def run_chat(db: Session, patient_id: int, message: str) -> dict:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    result = medsync_graph.invoke({
        "patient_id": patient_id,
        "message": message,
        "is_emergency": False,
        "intent": None,
        "retrieved_context": None,
        "final_response": None,
    })

    MemoryAgent.save_interaction(db, patient_id, message, result["final_response"])

    return {
        "response": result["final_response"],
        "intent": result.get("intent"),
        "is_emergency": result.get("is_emergency", False),
    }