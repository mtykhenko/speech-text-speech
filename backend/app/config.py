from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings"""
    
    # Database
    database_url: str = "postgresql://user:pass@postgres:5432/stt_tts"
    
    # Storage
    s3_endpoint: str = "http://seaweedfs:8333"
    s3_access_key: str = "any_access_key"
    s3_secret_key: str = "any_secret_key"
    s3_bucket_name: str = "stt-tts-storage"
    
    # API Keys
    openai_api_key: Optional[str] = None
    elevenlabs_api_key: Optional[str] = None
    google_credentials_path: Optional[str] = None
    azure_speech_key: Optional[str] = None
    azure_speech_region: Optional[str] = None
    
    # Application
    debug: bool = False
    log_level: str = "info"
    max_file_size: int = 100 * 1024 * 1024  # 100MB in bytes
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
