from pypdf import PdfReader
import io


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extracts all text from a PDF's raw bytes."""
    reader = PdfReader(io.BytesIO(file_bytes))
    text_parts = []
    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)
    return "\n".join(text_parts)


def extract_text_from_upload(filename: str, file_bytes: bytes) -> str:
    """Routes to the right extractor based on file extension."""
    if filename.lower().endswith(".pdf"):
        return extract_text_from_pdf(file_bytes)
    elif filename.lower().endswith(".txt"):
        return file_bytes.decode("utf-8", errors="ignore")
    else:
        raise ValueError(f"Unsupported file type: {filename}")