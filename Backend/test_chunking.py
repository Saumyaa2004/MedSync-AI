from app.services.chunking import chunk_text

sample = """
Metformin is a medication used to treat type 2 diabetes. It helps control blood sugar levels.
Common side effects include nausea, diarrhea, and stomach upset. These often improve over time.
Patients should take metformin with food to reduce stomach issues. Regular blood sugar monitoring is recommended.
"""

chunks = chunk_text(sample, chunk_size=100, overlap=20)
for i, c in enumerate(chunks):
    print(f"--- Chunk {i} ---")
    print(c)
    print()