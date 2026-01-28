from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_CORS_ORIGINS = [
    "http://localhost:3000",
    "https://diamond-admin-web.onrender.com",
    "https://tracking.majesticjewellers.com",
]


class Settings(BaseSettings):
    app_name: str = "Majestic Tracking"
    database_url: str = "postgresql+psycopg://diamond:diamond@localhost:5432/diamond"
    db_pool_size: int = 5
    db_max_overflow: int = 10
    db_pool_timeout: int = 30
    db_pool_recycle: int = 1800
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

    cors_origins: str = ",".join(DEFAULT_CORS_ORIGINS)
    cors_origin_regex: str = r"^https://([a-z0-9-]+\.)?majesticjewellers\.com$"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def cors_origins_list(self) -> List[str]:
        raw = self.cors_origins.strip()
        if not raw:
            raw = ",".join(DEFAULT_CORS_ORIGINS)
        origins: List[str] = []
        for origin in raw.split(","):
            value = origin.strip()
            if not value:
                continue
            if value == "*":
                origins.append(value)
                continue
            value = value.rstrip("/")
            if not value.startswith("http://") and not value.startswith("https://"):
                value = f"https://{value}"
            if value not in origins:
                origins.append(value)
        if "*" not in origins:
            for origin in DEFAULT_CORS_ORIGINS:
                normalized = origin.rstrip("/")
                if normalized not in origins:
                    origins.append(normalized)
        return origins


@lru_cache
def get_settings() -> Settings:
    return Settings()
