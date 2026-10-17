import httpx
from app.core.config import settings

GROQ_URL = "https://api.groq.com/openai/v1/audio/transcriptions"

# Hints that help Whisper spell medical words correctly
MEDICAL_PROMPT = (
    "Patient talking to a medical assistant about symptoms, medicines and appointments. "
    "Metformin, paracetamol, ibuprofen, amoxicillin, blood pressure, diabetes, hypertension."
)


def transcribe(audio: bytes, filename: str, content_type: str) -> dict:
    if not settings.GROQ_API_KEY:
        raise RuntimeError("GROQ_API_KEY is not set")

    r = httpx.post(
        GROQ_URL,
        headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
        files={"file": (filename, audio, content_type)},
        data={
            "model": settings.WHISPER_MODEL,
            "response_format": "verbose_json",
            "temperature": "0",
            "prompt": MEDICAL_PROMPT,
        },
        timeout=60,
    )
    r.raise_for_status()
    body = r.json()
    return {"text": body.get("text", "").strip(), "language": body.get("language")}