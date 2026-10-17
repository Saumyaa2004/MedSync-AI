from fastapi import HTTPException
from google.genai import errors as genai_errors
from sqlalchemy.orm import Session
from app.db.models import Patient
from app.agents.orchestrator import medsync_graph
from app.agents.memory_agent.memory_agent import MemoryAgent

USAGE_LIMIT_MESSAGE = "The AI assistant has reached its usage limit for today. Please try again later."
UNAVAILABLE_MESSAGE = "The AI assistant is temporarily unavailable. Please try again in a moment."


def run_chat(db: Session, patient_id: int, message: str) -> dict:
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    try:
        result = medsync_graph.invoke({
            "patient_id": patient_id,
            "message": message,
            "is_emergency": False,
            "intent": None,
            "retrieved_context": None,
            "final_response": None,
        })
    except genai_errors.APIError as e:
        # Emergencies never reach Gemini, so they still work when the quota is used up
        print(f"Gemini error {e.code}: {e.message}")
        if e.code == 429:
            raise HTTPException(status_code=429, detail=USAGE_LIMIT_MESSAGE)
        raise HTTPException(status_code=503, detail=UNAVAILABLE_MESSAGE)

    MemoryAgent.save_interaction(db, patient_id, message, result["final_response"])

    return {
        "response": result["final_response"],
        "intent": result.get("intent"),
        "is_emergency": result.get("is_emergency", False),
    }