from app.services.chunking import chunk_text
from app.services.vector_store import get_patient_collection
from app.services.document_parser import extract_text_from_upload


def ingest_patient_document(patient_id: int, filename: str, file_bytes: bytes) -> dict:
    text = extract_text_from_upload(filename, file_bytes)

    if not text.strip():
        raise ValueError("No extractable text found in document")

    chunks = chunk_text(text, chunk_size=500, overlap=50)
    collection = get_patient_collection(patient_id)

    ids = [f"{filename}_{i}" for i in range(len(chunks))]
    metadatas = [{"source": filename, "chunk_index": i} for i in range(len(chunks))]

    collection.add(documents=chunks, ids=ids, metadatas=metadatas)

    return {"filename": filename, "chunks_ingested": len(chunks)}


def answer_from_patient_documents(patient_id: int, question: str, n_results: int = 3) -> dict:
    from google import genai
    from app.core.config import settings

    client = genai.Client(api_key=settings.GEMINI_API_KEY)
    collection = get_patient_collection(patient_id)

    results = collection.query(query_texts=[question], n_results=n_results)
    retrieved_chunks = results["documents"][0]
    sources = [meta["source"] for meta in results["metadatas"][0]]

    if not retrieved_chunks:
        return {
            "answer": "I don't have any documents on file to answer that. Please upload your prescription or report first.",
            "sources": []
        }

    context = "\n\n".join(retrieved_chunks)

    prompt = f"""You are a healthcare assistant. Answer the patient's question
using ONLY the context from their uploaded medical documents below. If the
context doesn't contain the answer, say you don't have enough information —
do not make anything up.

Context:
{context}

Question: {question}

Answer:"""

    response = client.models.generate_content(model="gemini-3.5-flash", contents=prompt)

    return {"answer": response.text, "sources": list(set(sources))}