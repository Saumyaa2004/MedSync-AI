from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.db.database import get_db
from app.db.models import Patient
from app.services.patient_document_service import ingest_patient_document, answer_from_patient_documents

router = APIRouter(prefix="/documents", tags=["Patient Documents"])


@router.post("/{patient_id}/upload")
async def upload_document(patient_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    file_bytes = await file.read()

    try:
        result = ingest_patient_document(patient_id, file.filename, file_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"message": "Document ingested successfully", **result}


class DocumentAskRequest(BaseModel):
    question: str


@router.post("/{patient_id}/ask")
def ask_patient_documents(patient_id: int, payload: DocumentAskRequest, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    result = answer_from_patient_documents(patient_id, payload.question)
    return result