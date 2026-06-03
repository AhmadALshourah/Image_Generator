from functools import lru_cache
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
LogFormat = Literal["json", "console"]
StorageBackendKind = Literal["local", "s3"]


class Settings(BaseSettings):
    # ---- OpenAI ----------------------------------------------------------
    openai_api_key: str

    # ---- HTTP / Web -------------------------------------------------------
    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # ---- Persistence ------------------------------------------------------
    data_dir: str = ""  # empty = use backend/ root (local dev). Docker sets /data.

    # ---- Logging (#16) ----------------------------------------------------
    log_level: LogLevel = "INFO"
    log_format: LogFormat = "console"

    # ---- Storage backend (#15) -------------------------------------------
    storage_backend: StorageBackendKind = "local"
    s3_bucket: str = ""
    s3_region: str = ""
    s3_endpoint_url: str = ""            # set this for Cloudflare R2 / MinIO
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_public_base_url: str = ""         # e.g. https://cdn.example.com/

    # ---- Auth (#14) ------------------------------------------------------
    auth_enabled: bool = False
    owner_username: str = "owner"
    owner_password: str = ""             # bcrypt-hashed if set; plain checked once if not
    jwt_secret: str = "change-me-in-prod"
    jwt_algorithm: str = "HS256"
    jwt_ttl_hours: int = 24

    # ---- Embeddings (#17) ------------------------------------------------
    embeddings_enabled: bool = True
    embedding_model: str = "text-embedding-3-small"

    # ---- Observability (#27) ---------------------------------------------
    sentry_dsn: str = ""
    sentry_environment: str = "local"
    sentry_traces_sample_rate: float = 0.0

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
