from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Patient
from app.models.appointment import AppointmentCreate, AppointmentResponse
from app.agents.appointment_agent.appointment_agent import AppointmentAgent

router = APIRouter(prefix="/appointments", tags=["Appointments"])


@router.post("/", response_model=AppointmentResponse)
def create_appointment(payload: AppointmentCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == payload.patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    if not AppointmentAgent.is_slot_available(db, payload.doctor, payload.date):
        raise HTTPException(
            status_code=409,
            detail=f"Dr. {payload.doctor} is not available at this time. Please choose another slot."
        )

    appointment = AppointmentAgent.book_appointment(db, payload.patient_id, payload.doctor, payload.date)
    return appointment


@router.get("/patient/{patient_id}", response_model=list[AppointmentResponse])
def list_patient_appointments(patient_id: int, db: Session = Depends(get_db)):
    return AppointmentAgent.get_patient_appointments(db, patient_id)


@router.patch("/{appointment_id}/cancel", response_model=AppointmentResponse)
def cancel_appointment(appointment_id: int, db: Session = Depends(get_db)):
    appointment = AppointmentAgent.cancel_appointment(db, appointment_id)
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return appointment