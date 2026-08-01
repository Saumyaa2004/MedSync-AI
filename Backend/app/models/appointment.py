from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AppointmentCreate(BaseModel):
    patient_id: int
    doctor: str
    date: datetime


class AppointmentResponse(BaseModel):
    id: int
    patient_id: int
    doctor: str
    date: datetime
    status: str

    class Config:
        from_attributes = True


class AppointmentUpdate(BaseModel):
    status: Optional[str] = None
    date: Optional[datetime] = None