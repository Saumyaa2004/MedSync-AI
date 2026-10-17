from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    DATABASE_URL: str
    CHROMA_PERSIST_DIR: str = "./data/chroma_store"

    
    GROQ_API_KEY: str = ""
    WHISPER_MODEL: str = "whisper-large-v3-turbo"
    KOKORO_VOICE: str = "af_heart"
    KOKORO_MODEL_DIR: str = "./data/kokoro"

    class Config:
        env_file = ".env"

settings = Settings()