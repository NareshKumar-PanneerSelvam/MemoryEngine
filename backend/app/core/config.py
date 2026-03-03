from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    DATABASE_URL: str
    
    # JWT
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Google Gemini API
    GEMINI_API_KEY: str
    
    # CORS
    CORS_ORIGINS: str = (
        "http://localhost:5173,"
        "http://localhost:3000,"
        "https://memory-engine-seven.vercel.app"
    )
    CORS_ORIGIN_REGEX: str = ""
    
    # Environment
    ENVIRONMENT: str = "development"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from env, supporting CSV or JSON array formats."""
        raw = self.CORS_ORIGINS.strip()

        origins: List[str]
        if raw.startswith("["):
            try:
                parsed = json.loads(raw)
                origins = parsed if isinstance(parsed, list) else [raw]
            except json.JSONDecodeError:
                origins = [raw]
        else:
            origins = raw.split(",")

        normalized: List[str] = []
        for origin in origins:
            cleaned = str(origin).strip().strip("\"'").rstrip("/")
            if cleaned:
                normalized.append(cleaned)
        return normalized
    
    class Config:
        env_file = (".env", ".env.production")
        case_sensitive = True


settings = Settings()
