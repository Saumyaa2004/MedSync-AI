from app.services.chunking import chunk_text
from app.services.vector_store import knowledge_collection
import os

def ingest_file(filepath: str):
    with open(filepath, "r", encoding="utf-8") as f:
        text = f.read()

    chunks = chunk_text(text, chunk_size=400, overlap=50)
    filename = os.path.basename(filepath)

    ids = [f"{filename}_{i}" for i in range(len(chunks))]
    metadatas = [{"source": filename, "chunk_index": i} for i in range(len(chunks))]

    knowledge_collection.add(documents=chunks, ids=ids, metadatas=metadatas)
    print(f"✅ Ingested {len(chunks)} chunks from {filename}")


def ingest_all():
    knowledge_base_dir = "data/knowledge_base"
    files = [f for f in os.listdir(knowledge_base_dir) if f.endswith(".txt")]

    if not files:
        print("No files found in knowledge base directory")
        return

    for filename in files:
        filepath = os.path.join(knowledge_base_dir, filename)
        try:
            ingest_file(filepath)
        except Exception as e:
            print(f"❌ Failed to ingest {filename}: {e}")

    print(f"\n✅ Done — ingested {len(files)} files total")


if __name__ == "__main__":
    ingest_all()