"""Configuration management for infrastructure layer."""
from dataclasses import dataclass
from typing import Optional
import os


@dataclass
class DatabaseConfig:
    """Database configuration."""
    host: str = "localhost"
    port: int = 5432
    username: str = "hdlforge"
    password: str = "hdlforge"
    database: str = "hdlforge"
    pool_size: int = 5
    max_overflow: int = 10

    @property
    def url(self) -> str:
        return f"postgresql+asyncpg://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"

    @classmethod
    def from_env(cls) -> "DatabaseConfig":
        """Create config from environment variables."""
        return cls(
            host=os.getenv("POSTGRES_HOST", "localhost"),
            port=int(os.getenv("POSTGRES_PORT", "5432")),
            username=os.getenv("POSTGRES_USER", "hdlforge"),
            password=os.getenv("POSTGRES_PASSWORD", "hdlforge"),
            database=os.getenv("POSTGRES_DB", "hdlforge"),
            pool_size=int(os.getenv("DB_POOL_SIZE", "5")),
            max_overflow=int(os.getenv("DB_MAX_OVERFLOW", "10")),
        )


@dataclass
class ExecutionConfig:
    """Execution configuration."""
    use_docker: bool = True
    default_timeout: int = 5
    default_memory_mb: int = 256
    max_source_size: int = 50000
    max_output_size: int = 100000
    simulator: str = "verilator"

    @classmethod
    def from_env(cls) -> "ExecutionConfig":
        """Create config from environment variables."""
        return cls(
            use_docker=os.getenv("HDL_USE_DOCKER", "true").lower() == "true",
            default_timeout=int(os.getenv("HDL_EXECUTION_TIMEOUT", "5")),
            default_memory_mb=int(os.getenv("HDL_MEMORY_LIMIT", "256")),
            max_source_size=int(os.getenv("HDL_MAX_SOURCE_SIZE", "50000")),
            max_output_size=int(os.getenv("HDL_MAX_OUTPUT_SIZE", "100000")),
            simulator=os.getenv("SIMULATOR", "verilator"),
        )


@dataclass
class AuthConfig:
    """Authentication configuration."""
    secret_key: str = "dev-secret-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    @classmethod
    def from_env(cls) -> "AuthConfig":
        """Create config from environment variables."""
        return cls(
            secret_key=os.getenv("JWT_SECRET_KEY", "dev-secret-change-in-production"),
            algorithm=os.getenv("JWT_ALGORITHM", "HS256"),
            access_token_expire_minutes=int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")),
            refresh_token_expire_days=int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7")),
        )


@dataclass
class AppConfig:
    """Main application configuration."""
    database: DatabaseConfig = None
    execution: ExecutionConfig = None
    auth: AuthConfig = None
    cors_origins: list[str] = None
    debug: bool = False

    def __post_init__(self):
        if self.database is None:
            self.database = DatabaseConfig.from_env()
        if self.execution is None:
            self.execution = ExecutionConfig.from_env()
        if self.auth is None:
            self.auth = AuthConfig.from_env()
        if self.cors_origins is None:
            cors = os.getenv("CORS_ORIGINS", '["http://localhost:3000"]')
            import json
            self.cors_origins = json.loads(cors)
        self.debug = os.getenv("DEBUG", "false").lower() == "true"

    @classmethod
    def from_env(cls) -> "AppConfig":
        """Create config from environment variables."""
        return cls()


# Global config instance
config = AppConfig.from_env()