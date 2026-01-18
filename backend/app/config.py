from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:root@localhost:5432/directory_agent"
    
    # API Keys
    OPENAI_API_KEY: str = ""
    
    # Application
    APP_NAME: str = "SaaS Directory Agent"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    SECRET_KEY: str = "your-secret-key-change-in-production"
    
    # CORS
    ALLOWED_ORIGINS: list = ["http://localhost:3000", "http://localhost:5173"]
    
    # Browser Automation
    HEADLESS_BROWSER: bool = False  # Set to True in production
    BROWSER_TIMEOUT: int = 30000  # 30 seconds
    
    # AI Settings
    AI_MODEL: str = "gpt-4-vision-preview"  # or "claude-3-opus-20240229"
    AI_TEMPERATURE: float = 0.1
    MAX_TOKENS: int = 4096
    
    # Workflow
    MAX_RETRIES: int = 3
    RETRY_DELAY: int = 300  # 5 minutes in seconds
    CONCURRENT_SUBMISSIONS: int = 3
    
    # File Upload
    UPLOAD_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE: int = 5 * 1024 * 1024  # 5MB
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    return Settings()