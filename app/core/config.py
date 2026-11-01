from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, validator
from typing import List, Optional
import json

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=True)

    # App Info
    PROJECT_NAME: str = "Government Notice Simplifier"
    APP_ENV: str = "production"
    DEBUG: bool = False
    
    # Auth
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str
    REDIS_URL: str
    
    # GCP
    GOOGLE_CLOUD_PROJECT: str
    GCS_BUCKET_NAME: str
    DOCUMENT_AI_PROCESSOR_ID: str
    DOCUMENT_AI_LOCATION: str = "us"
    
    # AI (Gemini)
    GEMINI_API_KEY: str
    GEMINI_MODEL: str = "gemini-1.5-pro"
    
    # External APIs
    SENDGRID_API_KEY: Optional[str] = None
    FROM_EMAIL: str = "noreply@govnotice.in"
    
    # Security
    ALLOWED_ORIGINS: List[str] = ["*"]
    RATE_LIMIT_PER_MINUTE: int = 60
    
    @validator("ALLOWED_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v if isinstance(v, list) else json.loads(v)
        raise ValueError(v)

settings = Settings()
