import base64
import time

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.chat_service import run_chat
from app.services.voice.stt import transcribe
from app.services.voice.tts import synthesize
from app.services.voice.text_clean import clean_for_speech

router = APIRouter(prefix="/voice", tags=["Voice"])

MAX_AUDIO_BYTES = 10 * 1024 * 1024  # ~10 MB, a few minutes of opus


class VoiceResponse(BaseModel):
    transcript: str
    language: str | None
    response: str
    intent: str | None
    is_emergency: bool
    audio_base64: str | None
    timings: dict


class TTSRequest(BaseModel):
    text: str


# NOTE: /tts must be declared BEFORE /{patient_id}
@router.post("/tts")
def text_to_speech(payload: TTSRequest):
    wav = synthesize(clean_for_speech(payload.text))
    return Response(content=wav, media_type="audio/wav")


@router.post("/{patient_id}", response_model=VoiceResponse)
def voice_chat(patient_id: int, file: UploadFile = File(...), speak: bool = True,
               db: Session = Depends(get_db)):
    """speak=false skips TTS so the client can show the text reply immediately
    and fetch the audio separately from /voice/tts."""
    if not (file.content_type or "").startswith("audio/"):
        raise HTTPException(status_code=400, detail="Please upload an audio file")
    audio = file.file.read()
    if len(audio) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=413, detail="Recording is too long")

    t0 = time.perf_counter()
    try:
        stt = transcribe(audio, file.filename or "speech.webm", file.content_type)
    except Exception as e:
        print(f"STT failed: {e}")
        raise HTTPException(status_code=502, detail="Speech recognition failed. Please try again.")
    t1 = time.perf_counter()

    if not stt["text"]:
        raise HTTPException(status_code=422, detail="I couldn't hear anything. Please try again.")

    chat = run_chat(db, patient_id, stt["text"])   # same Safety + Memory path as typed chat
    t2 = time.perf_counter()

    audio_b64 = None
    if speak:
        try:
            audio_b64 = base64.b64encode(synthesize(clean_for_speech(chat["response"]))).decode()
        except Exception as e:
            print(f"TTS failed: {e}")               # still return the text reply
    t3 = time.perf_counter()

    return VoiceResponse(
        transcript=stt["text"],
        language=stt["language"],
        audio_base64=audio_b64,
        timings={
            "stt_ms": round((t1 - t0) * 1000),
            "agent_ms": round((t2 - t1) * 1000),
            "tts_ms": round((t3 - t2) * 1000),
        },
        **chat,
    )