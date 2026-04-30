from functools import lru_cache
from pathlib import Path

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        # Load apps/api/.env regardless of the working directory used to start the app.
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "SUtore API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/sutore"
    cors_origins_env: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        alias="CORS_ORIGINS",
    )
    cors_origin_regex: str = Field(
        default=(
            r"^https?://("
            r"localhost|"
            r"127\.0\.0\.1|"
            r"10(?:\.\d{1,3}){3}|"
            r"172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2}|"
            r"192\.168(?:\.\d{1,3}){2}"
            r")(?::\d+)?$"
        ),
        alias="CORS_ORIGIN_REGEX",
    )
    auto_create_tables: bool = False
    smtp_host: str | None = Field(default=None, alias="SMTP_HOST")
    smtp_port: int = Field(default=587, alias="SMTP_PORT")
    smtp_username: str | None = Field(default=None, alias="SMTP_USERNAME")
    smtp_password: str | None = Field(default=None, alias="SMTP_PASSWORD")
    smtp_use_tls: bool = Field(default=True, alias="SMTP_USE_TLS")
    smtp_use_ssl: bool = Field(default=False, alias="SMTP_USE_SSL")
    smtp_timeout_seconds: int = Field(default=20, alias="SMTP_TIMEOUT_SECONDS")
    mail_from_email: str | None = Field(default=None, alias="MAIL_FROM_EMAIL")
    mail_from_name: str = Field(default="SUtore Billing", alias="MAIL_FROM_NAME")

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.cors_origins_env.split(",")
            if origin.strip()
        ]

    @property
    def invoice_email_enabled(self) -> bool:
        return bool(
            (self.smtp_host or "").strip() and (self.mail_from_email or "").strip()
        )

    @model_validator(mode="after")
    def validate_smtp_transport(self) -> "Settings":
        if self.smtp_use_tls and self.smtp_use_ssl:
            raise ValueError("SMTP_USE_TLS and SMTP_USE_SSL cannot both be true.")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
