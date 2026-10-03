import logging
import os
import secrets
import ipaddress
from typing import Literal
from urllib.parse import urlsplit

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings
from sqlalchemy.engine import URL

logger = logging.getLogger(__name__)

# Known weak development-only values. These are never safe outside local
# development; verify_secret_defaults() flags them when DEBUG is disabled.
DEV_JWT_SECRET = "hdlforge-dev-secret-change-in-production"
DEV_POSTGRES_PASSWORD = "hdlforge"


class Settings(BaseSettings):
    ENVIRONMENT: Literal["development", "production"] = "development"
    PROJECT_NAME: str = "HDLForge"
    API_V1_PREFIX: str = "/api"
    DEBUG: bool = False

    POSTGRES_USER: str = "hdlforge"
    POSTGRES_PASSWORD: str = "hdlforge"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "hdlforge"

    DATABASE_URL: str = ""

    CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://hdl-forge.vercel.app",
        "https://hdlforge.vercel.app",
    ]
    CORS_ORIGIN_REGEX: str = ""
    HDL_WORKER_URL: str = ""
    HDL_WORKER_TOKEN: str = ""
    HDL_WORKER_MAX_CONCURRENT_JOBS: int = 2
    HDL_SANDBOX_IMAGE: str = "hdlforge-sandbox:latest"
    HDL_EXECUTION_RATE_LIMIT_PER_MINUTE: int = 10
    HDL_EXECUTION_RATE_LIMIT_PER_HOUR: int = 60

    HDL_EXECUTION_TIMEOUT: int = 5
    HDL_MEMORY_LIMIT: int = 256
    HDL_CPU_LIMIT: int = 5
    HDL_PROCESS_LIMIT: int = 64
    HDL_MAX_SOURCE_SIZE: int = 50000
    HDL_MAX_OUTPUT_SIZE: int = 100000
    HDL_MAX_WAVEFORM_SIZE: int = 5242880
    HDL_WAVEFORM_RETENTION_HOURS: int = 24
    HDL_USE_DOCKER: bool = True

    # Legacy local JWT (only used for the /auth/register+login flow).
    # Never hardcode a shared secret: when unset a fresh random secret is
    # generated per process so source code leaks can't forge tokens. Set a
    # strong, stable value via the JWT_SECRET env var if tokens must survive
    # restarts (or for multi-process deployments).
    JWT_SECRET: str = Field(
        default_factory=lambda: secrets.token_urlsafe(48),
        description="Secret for the legacy local JWT auth flow",
    )
    JWT_EXPIRY_HOURS: int = 72

    SUPABASE_URL: str = ""
    SUPABASE_SERVICE_ROLE_KEY: str = ""
    SUPABASE_JWT_SECRET: str = ""

    AI_ENABLED: bool = True
    AI_PROVIDER: str = "groq"
    AI_MODEL: str = "llama-3.3-70b-versatile"
    AI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"
    AI_MAX_INPUT_TOKENS: int = 4000
    AI_MAX_OUTPUT_TOKENS: int = 2000
    AI_RATE_LIMIT_PER_HOUR: int = 60
    AI_RATE_LIMIT_PER_MINUTE: int = 15

    SIMULATOR: str = "icarus"
    ADMIN_USERNAMES: str = "admin,bvsrujan,hdladmin"
    ADMIN_EMAILS: str = ""

    @property
    def admin_usernames_set(self) -> set[str]:
        return {u.strip().lower() for u in self.ADMIN_USERNAMES.split(",") if u.strip()}

    @property
    def admin_emails_set(self) -> set[str]:
        return {e.strip().lower() for e in self.ADMIN_EMAILS.split(",") if e.strip()}

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "env_ignore_empty": True,
    }

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, v):
        """Accept bool or truthy string values; treat non-boolean strings like
        'release' as False so a system DEBUG env var doesn't break startup."""
        if isinstance(v, bool):
            return v
        if isinstance(v, str):
            return v.lower() in ("1", "true", "yes", "on")
        return bool(v)

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        """Allow comma-separated list of origins or wildcard from environment variable."""
        if isinstance(v, str):
            if v.strip() == "*":
                return ["*"]
            return [orig.strip() for orig in v.split(",") if orig.strip()]
        return v

    def verify_secret_defaults(self) -> list[str]:
        """Return a list of insecure secrets still using built-in dev defaults."""
        issues: list[str] = []
        if self.DEBUG is not False:
            return issues
        if self.JWT_SECRET == DEV_JWT_SECRET:
            issues.append("JWT_SECRET is the dev default; set a strong unique value in production")
        if not self.DATABASE_URL and self.POSTGRES_PASSWORD == DEV_POSTGRES_PASSWORD:
            issues.append("POSTGRES_PASSWORD is the dev default; set a real password in production")
        return issues

    def get_database_url(self) -> str:
        """Return the database URL.

        Priority:
        1. Explicit DATABASE_URL env var (Supabase connection string)
        2. Constructed PostgreSQL URL from individual POSTGRES_* vars
        Never falls back to SQLite.
        """
        if self.DATABASE_URL:
            return self.DATABASE_URL
        if not self.POSTGRES_HOST:
            raise RuntimeError(
                "DATABASE_URL or POSTGRES_HOST must be set. "
                "SQLite is not supported in this application."
            )
        return URL.create(
            "postgresql",
            username=self.POSTGRES_USER,
            password=self.POSTGRES_PASSWORD,
            host=self.POSTGRES_HOST,
            port=self.POSTGRES_PORT,
            database=self.POSTGRES_DB,
        ).render_as_string(hide_password=False)

    def validate_production(self) -> None:
        if self.ENVIRONMENT != "production":
            return
        if "ENVIRONMENT" not in self.model_fields_set:
            raise RuntimeError("ENVIRONMENT=production must be explicitly configured.")
        if "JWT_SECRET" not in self.model_fields_set or len(self.JWT_SECRET) < 32:
            raise RuntimeError("Production requires an explicitly configured JWT_SECRET of at least 32 characters.")
        if self.DEBUG:
            raise RuntimeError("Production requires DEBUG=false.")
        if not self.SUPABASE_URL:
            raise RuntimeError("Production authentication requires SUPABASE_URL; local password authentication is disabled.")
        supabase_url = urlsplit(self.SUPABASE_URL)
        if supabase_url.scheme != "https" or not supabase_url.hostname:
            raise RuntimeError("Production SUPABASE_URL must use HTTPS.")
        if "ADMIN_EMAILS" not in self.model_fields_set or not self.admin_emails_set:
            raise RuntimeError("Production requires an explicit ADMIN_EMAILS allowlist of verified administrator accounts.")
        if not self.HDL_USE_DOCKER:
            raise RuntimeError("Production requires HDL_USE_DOCKER=true.")
        if not self.HDL_WORKER_URL or not self.HDL_WORKER_TOKEN or len(self.HDL_WORKER_TOKEN) < 32:
            raise RuntimeError("Production requires a private HDL_WORKER_URL and a shared token of at least 32 characters.")
        worker_url = urlsplit(self.HDL_WORKER_URL)
        worker_host = worker_url.hostname
        worker_is_private = False
        if worker_host:
            try:
                worker_is_private = ipaddress.ip_address(worker_host).is_private
            except ValueError:
                worker_is_private = (
                    worker_host in {"localhost"}
                    or worker_host.endswith((".internal", ".local"))
                    or "." not in worker_host
                )
        if worker_url.username or worker_url.password or not (
            (worker_url.scheme == "https" and worker_host)
            or (worker_url.scheme == "http" and worker_is_private)
        ):
            raise RuntimeError("HDL_WORKER_URL must be HTTPS or use a private/internal HTTP address.")
        if not self.HDL_SANDBOX_IMAGE.strip():
            raise RuntimeError("HDL_SANDBOX_IMAGE must name the hardened sandbox image.")
        if "CORS_ORIGINS" not in self.model_fields_set or not self.CORS_ORIGINS:
            raise RuntimeError("Production requires explicitly configured frontend CORS_ORIGINS.")
        for origin in self.CORS_ORIGINS:
            parsed_origin = urlsplit(origin)
            if (
                parsed_origin.scheme != "https"
                or not parsed_origin.hostname
                or parsed_origin.username
                or parsed_origin.password
                or parsed_origin.path != ""
                or parsed_origin.query
                or parsed_origin.fragment
            ):
                raise RuntimeError("Production CORS_ORIGINS must contain exact HTTPS origins only.")
        if self.CORS_ORIGIN_REGEX:
            raise RuntimeError("CORS_ORIGIN_REGEX must be empty in production; configure exact origins instead.")
        if not self.DATABASE_URL and self.POSTGRES_PASSWORD == DEV_POSTGRES_PASSWORD:
            raise RuntimeError("Production must use a non-default PostgreSQL password.")


settings = Settings()

for _issue in settings.verify_secret_defaults():
    logger.error("Production misconfiguration: %s", _issue)
