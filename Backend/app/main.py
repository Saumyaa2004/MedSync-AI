from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import patients, conversations, knowledge, appointments, chat, documents
from app.db.database import engine, Base
from app.db import models  # noqa

app = FastAPI(title="MedSync AI", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(patients.router)
app.include_router(conversations.router)
app.include_router(knowledge.router)
app.include_router(appointments.router)
app.include_router(chat.router)
app.include_router(documents.router)


@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    try:
        import os
        from app.services.chunking import chunk_text
        from app.services.vector_store import knowledge_collection

        knowledge_dir = "data/knowledge_base"
        if os.path.exists(knowledge_dir):
            files = [f for f in os.listdir(knowledge_dir) if f.endswith(".txt")]
            for filename in files:
                filepath = os.path.join(knowledge_dir, filename)
                with open(filepath, "r", encoding="utf-8") as f:
                    text = f.read()
                chunks = chunk_text(text, chunk_size=400, overlap=50)
                ids = [f"{filename}_{i}" for i in range(len(chunks))]
                metadatas = [{"source": filename, "chunk_index": i}
                             for i in range(len(chunks))]
                try:
                    knowledge_collection.add(
                        documents=chunks, ids=ids, metadatas=metadatas
                    )
                    print(f"Ingested: {filename}")
                except Exception:
                    print(f"Already ingested: {filename}")
    except Exception as e:
        print(f"Knowledge base ingestion skipped: {e}")


@app.get("/")
def root():
    return {"message": "MedSync AI backend is running"}


@app.get("/health")
def health_check():
    return {"status": "ok"}