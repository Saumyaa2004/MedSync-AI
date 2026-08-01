from app.services.rag_service import answer_from_knowledge_base

result = answer_from_knowledge_base("What are the side effects of metformin?")
print("Answer:", result["answer"])
print("Sources:", result["sources"])