from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer)
    email = Column(String, unique=True, index=True)
    password = Column(String, nullable=False, server_default="")  # add this line

    medical_history = relationship("MedicalHistory", back_populates="patient")
    conversations = relationship("Conversation", back_populates="patient")
    appointments = relationship("Appointment", back_populates="patient")
class MedicalHistory(Base):
    __tablename__ = "medical_history"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    condition = Column(String)
    medications = Column(Text)
    allergies = Column(Text)

    patient = relationship("Patient", back_populates="medical_history")


class Conversation(Base):
    __tablename__ = "conversations"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    query = Column(Text, nullable=False)
    response = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="conversations")


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor = Column(String, nullable=False)
    date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String, default="scheduled")

    patient = relationship("Patient", back_populates="appointments")