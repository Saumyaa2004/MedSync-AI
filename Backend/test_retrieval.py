from app.services.vector_store import knowledge_collection

results = knowledge_collection.query(
    query_texts=["What are the side effects of metformin?"],
    n_results=2
)

for i, doc in enumerate(results["documents"][0]):
    print(f"--- Result {i+1} ---")
    print(doc)
    print()