from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GEMINI_API_KEY: str
    DATABASE_URL: str
    CHROMA_PERSIST_DIR: str = "./data/chroma_store"

    class Config:
        env_file = ".env"

settings = Settings()