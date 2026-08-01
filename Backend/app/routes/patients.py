from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Patient
from app.models.patient import PatientCreate, PatientResponse, PatientLogin
from app.services.auth_service import hash_password, verify_password

router = APIRouter(prefix="/patients", tags=["Patients"])


@router.post("/", response_model=PatientResponse)
def create_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    existing = db.query(Patient).filter(Patient.email == patient.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Patient with this email already exists")

    new_patient = Patient(
        name=patient.name,
        age=patient.age,
        email=patient.email,
        password=hash_password(patient.password)
    )
    db.add(new_patient)
    db.commit()
    db.refresh(new_patient)
    return new_patient


@router.get("/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("/login", response_model=PatientResponse)
def login_patient(payload: PatientLogin, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.email == payload.email).first()
    if not patient:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(payload.password, patient.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    return patient


@router.get("/{patient_id}/summary")
def generate_patient_summary(patient_id: int, db: Session = Depends(get_db)):
    from google import genai
    from app.core.config import settings
    from app.agents.memory_agent.memory_agent import MemoryAgent

    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    history = MemoryAgent.get_recent_history(db, patient_id, limit=10)
    formatted = MemoryAgent.format_history_for_prompt(history)

    appointments = db.query(Appointment).filter(
        Appointment.patient_id == patient_id
    ).all()

    appt_text = "\n".join([
        f"- {a.doctor} on {a.date.strftime('%B %d, %Y')} ({a.status})"
        for a in appointments
    ]) or "No appointments recorded."

    client = genai.Client(api_key=settings.GEMINI_API_KEY)

    prompt = f"""Generate a brief clinical summary for this patient.

Patient: {patient.name}, Age: {patient.age or 'unknown'}

Recent Conversations:
{formatted}

Appointments:
{appt_text}

Write a 3-4 sentence clinical summary covering: main health concerns discussed, 
medications mentioned, upcoming appointments, and any alerts raised.
Keep it professional and concise."""

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt
    )

    return {
        "patient": patient.name,
        "summary": response.text
    }