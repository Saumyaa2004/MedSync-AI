from sqlalchemy.orm import Session
from sqlalchemy import and_
from datetime import datetime, timedelta
from app.db.models import Appointment


class AppointmentAgent:
    """Handles appointment availability checks, booking, and management."""

    @staticmethod
    def is_slot_available(db: Session, doctor: str, requested_time: datetime, buffer_minutes: int = 30) -> bool:
        """
        Checks if a doctor already has an appointment within `buffer_minutes`
        of the requested time, to avoid double-booking.
        """
        window_start = requested_time - timedelta(minutes=buffer_minutes)
        window_end = requested_time + timedelta(minutes=buffer_minutes)

        conflict = (
            db.query(Appointment)
            .filter(
                and_(
                    Appointment.doctor == doctor,
                    Appointment.date >= window_start,
                    Appointment.date <= window_end,
                    Appointment.status != "cancelled"
                )
            )
            .first()
        )
        return conflict is None

    @staticmethod
    def book_appointment(db: Session, patient_id: int, doctor: str, date: datetime) -> Appointment:
        appointment = Appointment(
            patient_id=patient_id,
            doctor=doctor,
            date=date,
            status="scheduled"
        )
        db.add(appointment)
        db.commit()
        db.refresh(appointment)
        return appointment

    @staticmethod
    def get_patient_appointments(db: Session, patient_id: int) -> list[Appointment]:
        return (
            db.query(Appointment)
            .filter(Appointment.patient_id == patient_id)
            .order_by(Appointment.date.asc())
            .all()
        )

    @staticmethod
    def cancel_appointment(db: Session, appointment_id: int) -> Appointment | None:
        appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
        if not appointment:
            return None
        appointment.status = "cancelled"
        db.commit()
        db.refresh(appointment)
        return appointment