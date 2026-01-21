from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:root@localhost:5432/directory_agent"

    # Ollama Configuration (Local AI)
    OLLAMA_HOST: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "qwen2.5vl:latest"

    # Application
    APP_NAME: str = "SaaS Directory Agent"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # Authentication
    SECRET_KEY: str = "PL3T6_LW0ElW268NtP0NOazCMTPGRhXVp_rQGQNXgrs="
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Encryption for directory credentials
    ENCRYPTION_KEY: str = ""  # Generate with: from cryptography.fernet import Fernet; Fernet.generate_key()

    # CORS - Single origin
    ALLOWED_ORIGINS: str = "http://localhost:5173"

    # Browser Automation
    HEADLESS_BROWSER: bool = True
    BROWSER_TIMEOUT: int = 30000
    USE_BROWSER_USE: bool = True  # Use Browser Use library for AI-powered automation

    # AI Settings
    AI_TEMPERATURE: float = 0.1
    MAX_TOKENS: int = 4096

    # Workflow
    MAX_RETRIES: int = 3
    RETRY_DELAY: int = 300
    CONCURRENT_SUBMISSIONS: int = 3

    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024

    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    @property
    def cors_origins(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings():
    return Settings()
