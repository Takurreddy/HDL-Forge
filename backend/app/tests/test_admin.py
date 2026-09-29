import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base, get_db
from app.db.models import Profile, Difficulty, Language, Problem
from app.main import app


@pytest.fixture
def db_engine():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    yield engine
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client(db_engine):
    TestSession = sessionmaker(bind=db_engine)

    def override_get_db():
        session = TestSession()
        try:
            yield session
        finally:
            session.close()

    saved_overrides = dict(app.dependency_overrides)
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    app.dependency_overrides.update(saved_overrides)


class TestAdminEndpoints:
    def test_check_unauthenticated(self, client):
        res = client.get("/api/admin/check")
        assert res.status_code == 200
        data = res.json()
        assert data["is_admin"] is False
        assert data["authenticated"] is False

    def test_stats_requires_auth(self, client):
        res = client.get("/api/admin/stats")
        assert res.status_code == 401

    def test_stats_forbidden_for_regular_user(self, client):
        # Register a regular user
        reg_res = client.post(
            "/api/auth/register",
            json={
                "email": "regular@example.com",
                "username": "regularuser",
                "password": "password123",
            },
        )
        assert reg_res.status_code == 200
        token = reg_res.json()["token"]

        # Call /api/admin/stats with regular user token
        res = client.get(
            "/api/admin/stats",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert res.status_code == 403
        assert "Admin privileges required" in res.json()["detail"]

    def test_stats_success_for_admin_user(self, client):
        # Register an admin user (username in ADMIN_USERNAMES)
        reg_res = client.post(
            "/api/auth/register",
            json={
                "email": "admin@hdlforge.com",
                "username": "admin",
                "password": "password123",
            },
        )
        assert reg_res.status_code == 200
        token = reg_res.json()["token"]

        # Check /api/admin/check
        check_res = client.get(
            "/api/admin/check",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert check_res.status_code == 200
        assert check_res.json()["is_admin"] is True

        # Call /api/admin/stats
        stats_res = client.get(
            "/api/admin/stats",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert stats_res.status_code == 200
        data = stats_res.json()
        assert "total_problems" in data
        assert "pass_rate" in data
        assert "system_health" in data
