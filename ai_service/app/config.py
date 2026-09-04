import os

class Settings:
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/cognivive_db")
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"

settings = Settings()
