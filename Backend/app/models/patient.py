from pydantic import BaseModel, EmailStr
from typing import Optional


class PatientCreate(BaseModel):
    name: str
    age: Optional[int] = None
    email: EmailStr
    password: str


class PatientLogin(BaseModel):
    email: str
    password: str


class PatientResponse(BaseModel):
    id: int
    name: str
    age: Optional[int]
    email: str

    class Config:
        from_attributes = True