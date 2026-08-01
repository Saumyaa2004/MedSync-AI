from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import patients, conversations, knowledge, appointments, chat, documents
from app.db.database import engine, Base
from app.db import models  # noqa

app = FastAPI(title="MedSync AI", version="0.1.0")

@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patients.router)
app.include_router(conversations.router)
app.include_router(knowledge.router)
app.include_router(appointments.router)
app.include_router(chat.router)
app.include_router(documents.router)

@app.get("/")
def root():
    return {"message": "MedSync AI backend is running"}

@app.get("/health")
def health_check():
    return {"status": "ok"}