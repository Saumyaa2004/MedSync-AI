import io
import os
import threading

import httpx
import onnxruntime as ort
import soundfile as sf
from kokoro_onnx import Kokoro
from app.core.config import settings

BASE_URL = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0"
# The full-precision model (~325 MB) is ~2x faster on CPU than the int8 one, whose
# quantized ops aren't well optimized in onnxruntime (measured: RTF 1.07 vs 2.33).
MODEL_FILE = settings.KOKORO_MODEL_FILE
VOICES_FILE = "voices-v1.0.bin"

_kokoro = None
_lock = threading.Lock()


def _download(name: str) -> str:
    path = os.path.join(settings.KOKORO_MODEL_DIR, name)
    if not os.path.exists(path):
        os.makedirs(settings.KOKORO_MODEL_DIR, exist_ok=True)
        with httpx.stream("GET", f"{BASE_URL}/{name}", follow_redirects=True, timeout=600) as r:
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
            options = ort.SessionOptions()
            if settings.KOKORO_THREADS > 0:  # cap threads on shared-CPU hosts
                options.intra_op_num_threads = settings.KOKORO_THREADS
            session = ort.InferenceSession(
                _download(MODEL_FILE), options, providers=["CPUExecutionProvider"]
            )
            _kokoro = Kokoro.from_session(session, _download(VOICES_FILE))
            print(f"Kokoro TTS ready ({MODEL_FILE})")
    return _kokoro


def synthesize(text: str, voice: str | None = None) -> bytes:
    samples, sample_rate = get_kokoro().create(
        text, voice=voice or settings.KOKORO_VOICE, speed=1.0, lang="en-us"
    )
    buf = io.BytesIO()
    sf.write(buf, samples, sample_rate, format="WAV")
    return buf.getvalue()
