"""pytest configuration for the backend test suite."""
from contextlib import asynccontextmanager

import pytest


@pytest.fixture(autouse=True)
def clear_local_email_registry():
    """Clear the in-memory email registry before each test to ensure isolation."""
    from app.services import auth_service
    with auth_service._local_email_lock:
        auth_service._local_email_registry.clear()
    yield
    with auth_service._local_email_lock:
        auth_service._local_email_registry.clear()


@pytest.fixture(autouse=True)
def isolate_application_lifespan(monkeypatch):
    """Keep API tests on their SQLite fixtures instead of requiring local PostgreSQL/Docker."""
    from app.main import app

    @asynccontextmanager
    async def test_lifespan(_app):
        yield

    monkeypatch.setattr(app.router, "lifespan_context", test_lifespan)
