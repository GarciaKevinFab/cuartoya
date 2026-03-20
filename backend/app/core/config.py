from pydantic_settings import BaseSettings
from typing import List
import json


class Settings(BaseSettings):
    APP_NAME: str = "CuartoYa"
    APP_ENV: str = "development"
    APP_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:5173"

    DATABASE_URL: str = "sqlite+aiosqlite:///./cuartoya.db"
    REDIS_URL: str = "redis://localhost:6379/0"

    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 10080  # 7 dias

    CLOUDINARY_CLOUD_NAME: str = ""
    CLOUDINARY_API_KEY: str = ""
    CLOUDINARY_API_SECRET: str = ""

    CULQI_PUBLIC_KEY: str = ""
    CULQI_SECRET_KEY: str = ""

    RESEND_API_KEY: str = ""
    EMAIL_FROM: str = "noreply@cuartoya.pe"

    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_PRIVATE_KEY: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""

    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000","exp://localhost:19000"]'

    @property
    def cors_origins_list(self) -> List[str]:
        return json.loads(self.CORS_ORIGINS)

    class Config:
        env_file = ".env"
        extra = "allow"


settings = Settings()
