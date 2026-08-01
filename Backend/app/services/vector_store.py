from google import genai
from chromadb.utils import embedding_functions
from app.core.config import settings
import os
import chromadb


class GeminiEmbeddingFunction(embedding_functions.EmbeddingFunction):
    def __init__(self, api_key: str):
        self.client = genai.Client(api_key=api_key)

    def __call__(self, input: list[str]) -> list[list[float]]:
        embeddings = []
        for text in input:
            result = self.client.models.embed_content(
                model="gemini-embedding-001",
                contents=text
            )
            embeddings.append(result.embeddings[0].values)
        return embeddings


os.makedirs(settings.CHROMA_PERSIST_DIR, exist_ok=True)

client = chromadb.PersistentClient(path=settings.CHROMA_PERSIST_DIR)

embedding_fn = GeminiEmbeddingFunction(api_key=settings.GEMINI_API_KEY)

knowledge_collection = client.get_or_create_collection(
    name="healthcare_knowledge",
    embedding_function=embedding_fn
)


def get_patient_collection(patient_id: int):
    """Each patient gets their own isolated ChromaDB collection for personal documents."""
    return client.get_or_create_collection(
        name=f"patient_{patient_id}_docs",
        embedding_function=embedding_fn
    )