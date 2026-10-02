import os
from typing import List, Union
from pydantic import AnyHttpUrl, validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "SkyBook - Flight Booking Platform"
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/skybook_db"
    )
    
    # Auth & Security
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "skybook-dev-insecure-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    
    # Admin Seed Credentials
    ADMIN_USERNAME: str = os.getenv("ADMIN_USERNAME", "admin")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "Admin@123")
    ADMIN_FULL_NAME: str = os.getenv("ADMIN_FULL_NAME", "SkyBook Administrator")
    ADMIN_WHATSAPP: str = os.getenv("ADMIN_WHATSAPP", "+919876543210")
    
    # LLM Settings: Supports Gemini and Grok/xAI
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    XAI_API_KEY: str = os.getenv("XAI_API_KEY", "")
    GROK_MODEL: str = os.getenv("GROK_MODEL", "grok-beta")
    
    # Twilio WhatsApp Integration (Sandbox)
    TWILIO_ACCOUNT_SID: str = os.getenv("TWILIO_ACCOUNT_SID", "AC_mock_sandbox_sid")
    TWILIO_AUTH_TOKEN: str = os.getenv("TWILIO_AUTH_TOKEN", "mock_auth_token")
    TWILIO_WHATSAPP_NUMBER: str = os.getenv("TWILIO_WHATSAPP_NUMBER", "whatsapp:+14155238886")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

    model_config = SettingsConfigDict(
        env_file=(".env", "../.env"), 
        env_file_encoding="utf-8", 
        extra="ignore"
    )


settings = Settings()
