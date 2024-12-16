from pydantic_settings import BaseSettings
from datetime import timedelta

class AuthConfig(BaseSettings):
    SECRET_KEY: str = "your-secret-key-here"  # In production, this should be in .env
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    class Config:
        env_prefix = "AUTH_"

auth_config = AuthConfig() 