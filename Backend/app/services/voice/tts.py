import io
import os
import threading

import httpx
import soundfile as sf
from kokoro_onnx import Kokoro
from app.core.config import settings

BASE_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"
MODEL_FILE = "kokoro-v1.0.int8.onnx"   # ~90 MB quantized, fast on CPU
VOICES_FILE = "voices-v1.0.bin"

_kokoro = None
_lock = threading.Lock()


def _download(name: str) -> str:
    path = os.path.join(settings.KOKORO_MODEL_DIR, name)
    if not os.path.exists(path):
        os.makedirs(settings.KOKORO_MODEL_DIR, exist_ok=True)
        with httpx.stream("GET", f"{BASE_URL}/{name}", follow_redirects=True, timeout=300) as r:
            r.raise_for_status()
            with open(path + ".part", "wb") as f:
                for chunk in r.iter_bytes():
                    f.write(chunk)
        os.replace(path + ".part", path)
    return path


def get_kokoro() -> Kokoro:
    global _kokoro
    with _lock:
        if _kokoro is None:
            _kokoro = Kokoro(_download(MODEL_FILE), _download(VOICES_FILE))
            print("Kokoro TTS ready")
    return _kokoro


def synthesize(text: str, voice: str | None = None) -> bytes:
    samples, sample_rate = get_kokoro().create(
        text, voice=voice or settings.KOKORO_VOICE, speed=1.0, lang="en-us"
    )
    buf = io.BytesIO()
    sf.write(buf, samples, sample_rate, format="WAV")
    return buf.getvalue()