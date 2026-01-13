from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Majestic Tracking"
    database_url: str = "postgresql+psycopg://diamond:diamond@localhost:5432/diamond"
    secret_key: str = "change-me"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14

    admin_username: str = "admin"
    admin_password: str = "admin123"

    storage_backend: str = "s3"
    s3_endpoint_url: str = "http://localhost:9000"
    s3_bucket: str = "diamond-uploads"
    s3_access_key: str = "minio"
    s3_secret_key: str = "minio123"
    s3_region: str = "us-east-1"
    local_storage_path: str = "./storage"

    cors_origins: str = "http://localhost:3000"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
