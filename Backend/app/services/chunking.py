def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """
    Splits text into overlapping chunks for embedding.
    chunk_size and overlap are in characters (simple approach — good enough for this project).
    """
    if not text:
        return []

    chunks = []
    start = 0
    text_length = len(text)

    while start < text_length:
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk.strip())
        start += chunk_size - overlap  # move forward, but overlap a bit for context continuity

    return [c for c in chunks if c]  # drop empty chunks