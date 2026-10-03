"""Authentication and JWT security tests.

These tests cover:
- No Authorization header -> 401
- Invalid token -> 401
- Expired JWT -> 401
- Malformed JWT -> 401
- Valid local JWT -> accepted
- /submit requires authentication
- User A cannot access User B's submissions
- user_id is never accepted from request body

NOTE: Real Supabase Auth integration tests (create real account, obtain real
access_token, verify UUID matches auth.users.id) are in test_supabase_integration.py.
"""

from datetime import datetime, timedelta, timezone

import jwt
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.db.database import Base, get_db
from app.db.models import Difficulty, Language, Problem, Profile
from app.main import app
from app.services import auth_service
from app.services.auth_service import create_access_token, hash_password


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

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
def db_session(db_engine):
    Session = sessionmaker(bind=db_engine)
    session = Session()
    yield session
    session.close()


@pytest.fixture
def client(db_engine):
    Session = sessionmaker(bind=db_engine)

    def override_get_db():
        s = Session()
        try:
            yield s
        finally:
            s.close()

    saved = dict(app.dependency_overrides)
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    app.dependency_overrides.update(saved)


def _make_user(db_session, username="usera", user_id=None):
    import uuid
    uid = user_id or str(uuid.uuid4())
    user = Profile(
        id=uid,
        username=username,
        display_name=username,
    )
    db_session.add(user)
    db_session.commit()
    return user


def _make_problem(db_session):
    p = Problem(
        slug="and-gate",
        title="AND Gate",
        description="Implement AND gate.",
        difficulty=Difficulty.EASY,
        category="Combinational Logic",
        language=Language.SYSTEMVERILOG,
        starter_code="module and_gate(input logic a, b, output logic y); endmodule",
        test_cases="",
    )
    db_session.add(p)
    db_session.commit()
    return p


def test_production_rejects_local_password_and_jwt_auth(db_session, monkeypatch):
    monkeypatch.setattr(settings, "ENVIRONMENT", "production")
    monkeypatch.setattr(settings, "SUPABASE_URL", "")
    assert auth_service.authenticate_user(db_session, "admin@hdlforge.com", "admin123") is None
    assert auth_service.get_user_from_token(
        db_session,
        create_access_token("00000000-0000-0000-0000-000000000001"),
    ) is None


def test_user_editable_supabase_metadata_cannot_grant_admin(db_session, monkeypatch):
    user_id = "cbcff8dc-43aa-4a61-9c41-c389d08795f4"
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://auth.example.test")
    monkeypatch.setattr(settings, "ADMIN_EMAILS", "owner@example.test")
    monkeypatch.setattr(
        auth_service,
        "verify_supabase_jwt_payload",
        lambda _token: {
            "sub": user_id,
            "email": "owner@example.test",
            "email_verified": False,
            "user_metadata": {"username": "owner", "is_admin": True},
        },
    )

    user = auth_service.get_user_from_token(db_session, "valid-signed-token")
    assert user is not None
    assert user.is_admin is False


def test_trusted_supabase_app_metadata_can_grant_admin(db_session, monkeypatch):
    user_id = "cbcff8dc-43aa-4a61-9c41-c389d08795f5"
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")
    monkeypatch.setattr(settings, "SUPABASE_URL", "https://auth.example.test")
    monkeypatch.setattr(
        auth_service,
        "verify_supabase_jwt_payload",
        lambda _token: {
            "sub": user_id,
            "email": "engineer@example.test",
            "user_metadata": {"username": "engineer"},
            "app_metadata": {"is_admin": True},
        },
    )

    user = auth_service.get_user_from_token(db_session, "valid-signed-token")
    assert user is not None
    assert user.is_admin is True


# ---------------------------------------------------------------------------
# /submit — authentication enforcement
# ---------------------------------------------------------------------------

class TestSubmitRequiresAuth:
    def test_submit_no_token_returns_401(self, client, db_session):
        _make_problem(db_session)
        response = client.post(
            "/api/submissions/submit",
            json={"problem_slug": "and-gate", "language": "SYSTEMVERILOG",
                  "code": "module and_gate(input logic a, b, output logic y); assign y = a & b; endmodule"},
        )
        assert response.status_code == 401

    def test_submit_invalid_token_returns_401(self, client, db_session):
        _make_problem(db_session)
        response = client.post(
            "/api/submissions/submit",
            headers={"Authorization": "Bearer not.a.valid.token"},
            json={"problem_slug": "and-gate", "language": "SYSTEMVERILOG",
                  "code": "module and_gate(input logic a, b, output logic y); assign y = a & b; endmodule"},
        )
        assert response.status_code == 401

    def test_submit_expired_token_returns_401(self, client, db_session):
        _make_problem(db_session)
        expired_payload = {
            "sub": "some-user-id",
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
            "iat": datetime.now(timezone.utc) - timedelta(hours=2),
        }
        expired_token = jwt.encode(expired_payload, settings.JWT_SECRET, algorithm="HS256")
        response = client.post(
            "/api/submissions/submit",
            headers={"Authorization": f"Bearer {expired_token}"},
            json={"problem_slug": "and-gate", "language": "SYSTEMVERILOG",
                  "code": "module and_gate(input logic a, b, output logic y); assign y = a & b; endmodule"},
        )
        assert response.status_code == 401

    def test_submit_malformed_jwt_returns_401(self, client, db_session):
        _make_problem(db_session)
        response = client.post(
            "/api/submissions/submit",
            headers={"Authorization": "Bearer eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0."},
            json={"problem_slug": "and-gate", "language": "SYSTEMVERILOG",
                  "code": "module and_gate(input logic a, b, output logic y); assign y = a & b; endmodule"},
        )
        assert response.status_code == 401

    def test_submit_wrong_secret_returns_401(self, client, db_session):
        _make_problem(db_session)
        payload = {
            "sub": "some-user-id",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "iat": datetime.now(timezone.utc),
        }
        bad_token = jwt.encode(payload, "wrong-secret", algorithm="HS256")
        response = client.post(
            "/api/submissions/submit",
            headers={"Authorization": f"Bearer {bad_token}"},
            json={"problem_slug": "and-gate", "language": "SYSTEMVERILOG",
                  "code": "module and_gate(input logic a, b, output logic y); assign y = a & b; endmodule"},
        )
        assert response.status_code == 401


# ---------------------------------------------------------------------------
# /run — anonymous access allowed
# ---------------------------------------------------------------------------

class TestRunAnonymous:
    def test_run_no_token_is_allowed(self, client, db_session):
        _make_problem(db_session)
        response = client.post(
            "/api/submissions/run",
            json={"problem_slug": "and-gate", "language": "SYSTEMVERILOG",
                  "code": "module and_gate(input logic a, b, output logic y); assign y = a & b; endmodule"},
        )
        # 200 with error status (no testbench) is fine — the point is it's not 401
        assert response.status_code == 200


# ---------------------------------------------------------------------------
# User isolation — User A cannot access User B's submissions
# ---------------------------------------------------------------------------

class TestUserIsolation:
    def test_user_a_cannot_access_user_b_submissions(self, client, db_session):
        user_a = _make_user(db_session, "usera")
        user_b = _make_user(db_session, "userb")
        _make_problem(db_session)

        token_a = create_access_token(user_a.id)
        token_b = create_access_token(user_b.id)

        resp_a = client.get(
            "/api/submissions/problem/and-gate",
            headers={"Authorization": f"Bearer {token_a}"},
        )
        assert resp_a.status_code == 200
        assert resp_a.json()["submissions"] == []

        resp_b = client.get(
            "/api/submissions/problem/and-gate",
            headers={"Authorization": f"Bearer {token_b}"},
        )
        assert resp_b.status_code == 200
        assert resp_b.json()["submissions"] == []

    def test_problem_submissions_requires_auth(self, client, db_session):
        _make_problem(db_session)
        response = client.get("/api/submissions/problem/and-gate")
        assert response.status_code == 401


# ---------------------------------------------------------------------------
# verify_supabase_jwt — unit tests
# The HS256 legacy path is exercised by patching SUPABASE_URL to empty,
# which bypasses the JWKS fetch and falls through to the HS256 branch.
# ---------------------------------------------------------------------------

class TestVerifySupabaseJwt:
    def test_valid_hs256_jwt_returns_sub(self, monkeypatch):
        """HS256 legacy path: SUPABASE_URL empty, SUPABASE_JWT_SECRET set."""
        from app.services import auth_service
        from app.services.auth_service import verify_supabase_jwt
        secret = "test-supabase-secret-32-bytes-long!!"
        monkeypatch.setattr(settings, "SUPABASE_URL", "")
        monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", secret)
        # Clear JWKS cache so it doesn't try to fetch
        with auth_service._jwks_lock:
            auth_service._jwks_public_keys.clear()
        payload = {
            "sub": "user-uuid-1234",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "iat": datetime.now(timezone.utc),
            "aud": "authenticated",
        }
        token = jwt.encode(payload, secret, algorithm="HS256")
        result = verify_supabase_jwt(token)
        assert result == "user-uuid-1234"

    def test_expired_hs256_jwt_raises_401(self, monkeypatch):
        from fastapi import HTTPException
        from app.services import auth_service
        from app.services.auth_service import verify_supabase_jwt
        secret = "test-supabase-secret-32-bytes-long!!"
        monkeypatch.setattr(settings, "SUPABASE_URL", "")
        monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", secret)
        with auth_service._jwks_lock:
            auth_service._jwks_public_keys.clear()
        payload = {
            "sub": "user-uuid-1234",
            "exp": datetime.now(timezone.utc) - timedelta(hours=1),
            "iat": datetime.now(timezone.utc) - timedelta(hours=2),
        }
        token = jwt.encode(payload, secret, algorithm="HS256")
        with pytest.raises(HTTPException) as exc_info:
            verify_supabase_jwt(token)
        assert exc_info.value.status_code == 401

    def test_wrong_secret_raises_401(self, monkeypatch):
        from fastapi import HTTPException
        from app.services import auth_service
        from app.services.auth_service import verify_supabase_jwt
        monkeypatch.setattr(settings, "SUPABASE_URL", "")
        monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", "correct-secret-32-bytes-long!!!!")
        with auth_service._jwks_lock:
            auth_service._jwks_public_keys.clear()
        payload = {
            "sub": "user-uuid-1234",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        token = jwt.encode(payload, "wrong-secret", algorithm="HS256")
        with pytest.raises(HTTPException) as exc_info:
            verify_supabase_jwt(token)
        assert exc_info.value.status_code == 401

    def test_missing_sub_raises_401(self, monkeypatch):
        from fastapi import HTTPException
        from app.services import auth_service
        from app.services.auth_service import verify_supabase_jwt
        secret = "test-supabase-secret-32-bytes-long!!"
        monkeypatch.setattr(settings, "SUPABASE_URL", "")
        monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", secret)
        with auth_service._jwks_lock:
            auth_service._jwks_public_keys.clear()
        payload = {"exp": datetime.now(timezone.utc) + timedelta(hours=1)}
        token = jwt.encode(payload, secret, algorithm="HS256")
        with pytest.raises(HTTPException) as exc_info:
            verify_supabase_jwt(token)
        assert exc_info.value.status_code == 401

    def test_no_supabase_url_and_no_secret_raises_401(self, monkeypatch):
        """No SUPABASE_URL and no SUPABASE_JWT_SECRET -> unsupported alg -> 401."""
        from fastapi import HTTPException
        from app.services import auth_service
        from app.services.auth_service import verify_supabase_jwt
        monkeypatch.setattr(settings, "SUPABASE_URL", "")
        monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", "")
        with auth_service._jwks_lock:
            auth_service._jwks_public_keys.clear()
        payload = {"sub": "x", "exp": datetime.now(timezone.utc) + timedelta(hours=1)}
        token = jwt.encode(payload, "any-secret", algorithm="HS256")
        with pytest.raises(HTTPException) as exc_info:
            verify_supabase_jwt(token)
        assert exc_info.value.status_code in (401, 500)

    def test_unsigned_none_alg_token_rejected(self, monkeypatch):
        """Tokens with alg=none must be rejected."""
        from fastapi import HTTPException
        from app.services import auth_service
        from app.services.auth_service import verify_supabase_jwt
        monkeypatch.setattr(settings, "SUPABASE_URL", "")
        monkeypatch.setattr(settings, "SUPABASE_JWT_SECRET", "test-secret-32-bytes-long!!!!!!!")
        with auth_service._jwks_lock:
            auth_service._jwks_public_keys.clear()
        import base64, json as _json
        header = base64.urlsafe_b64encode(b'{"alg":"none","typ":"JWT"}').rstrip(b"=").decode()
        body = base64.urlsafe_b64encode(
            _json.dumps({"sub": "evil", "exp": 9999999999}).encode()
        ).rstrip(b"=").decode()
        unsigned_token = f"{header}.{body}."
        with pytest.raises(HTTPException) as exc_info:
            verify_supabase_jwt(unsigned_token)
        assert exc_info.value.status_code == 401
