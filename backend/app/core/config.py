import logging
import secrets

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings

logger = logging.getLogger(__name__)

# Known weak development-only values. These are never safe outside local
# development; verify_secret_defaults() flags them when DEBUG is disabled.
DEV_JWT_SECRET = "hdlforge-dev-secret-change-in-production"
DEV_POSTGRES_PASSWORD = "hdlforge"


class Settings(BaseSettings):
    PROJECT_NAME: str = "HDLForge"
    API_V1_PREFIX: str = "/api"
    DEBUG: bool = False

    POSTGRES_USER: str = "hdlforge"
    POSTGRES_PASSWORD: str = "hdlforge"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "hdlforge"

    DATABASE_URL: str = ""

    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

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

    AI_ENABLED: bool = False
    AI_PROVIDER: str = "openai"
    AI_MODEL: str = "gpt-4o-mini"
    AI_API_KEY: str = ""
    AI_MAX_INPUT_TOKENS: int = 4000
    AI_MAX_OUTPUT_TOKENS: int = 2000
    AI_RATE_LIMIT_PER_HOUR: int = 30
    AI_RATE_LIMIT_PER_MINUTE: int = 5

    SIMULATOR: str = "icarus"

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

    def verify_secret_defaults(self) -> list[str]:
        """Return a list of insecure secrets still using built-in dev defaults.

        Empty when safe. Called at import time (non-fatal on purpose so local
        development and tests keep working); production deployments should
        surface the returned warnings loudly.
        """
        issues: list[str] = []
        if self.DEBUG is not False:
            return issues
        if self.JWT_SECRET == DEV_JWT_SECRET:
            issues.append("JWT_SECRET is the dev default; set a strong unique value in production")
        if not self.DATABASE_URL and self.POSTGRES_PASSWORD == DEV_POSTGRES_PASSWORD:
            issues.append("POSTGRES_PASSWORD is the dev default; set a real password in production")
        if not self.SUPABASE_URL and not self.SUPABASE_SERVICE_ROLE_KEY:
            issues.append("Supabase is unconfigured in production")
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
        return (
            f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}"
            f"@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )


settings = Settings()

for _issue in settings.verify_secret_defaults():
    logger.error("Production misconfiguration: %s", _issue)
