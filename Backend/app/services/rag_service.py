from google import genai
from app.services.vector_store import knowledge_collection
from app.core.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)


def answer_from_knowledge_base(question: str, n_results: int = 3) -> dict:
    """
    Retrieves relevant chunks from ChromaDB, then asks Gemini to answer
    the question grounded ONLY in that retrieved context.
    """
    results = knowledge_collection.query(
        query_texts=[question],
        n_results=n_results
    )

    retrieved_chunks = results["documents"][0]
    sources = [meta["source"] for meta in results["metadatas"][0]]

    if not retrieved_chunks:
        return {
            "answer": "I don't have enough information to answer that.",
            "sources": []
        }

    context = "\n\n".join(retrieved_chunks)

    prompt = f"""You are a healthcare assistant. Answer the patient's question
using ONLY the context below. If the context doesn't contain the answer,
say you don't have enough information — do not make anything up.

Context:
{context}

Question: {question}

Answer:"""

    response = client.models.generate_content(
        model="gemini-3.5-flash",
        contents=prompt
    )

    return {
        "answer": response.text,
        "sources": list(set(sources))  # dedupe source filenames
    }