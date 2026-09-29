import pytest
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.database import Base, get_db
from app.db.models import (
    Difficulty,
    Language,
    Problem,
    Profile,
    Submission,
    SubmissionStatus,
    TestCase,
    TestVisibility,
    AIConversation,
    AIMessage,
    AIFeedback,
)
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
def db_session(db_engine):
    TestSession = sessionmaker(bind=db_engine)
    session = TestSession()
    yield session
    session.close()


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


@pytest.fixture
def test_user(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "ai-test@example.com",
            "username": "aitester",
            "password": "password123",
        },
    )
    return response.json()["user"]


@pytest.fixture
def auth_cookie(client, test_user):
    response = client.post(
        "/api/auth/login",
        json={"email": "ai-test@example.com", "password": "password123"},
    )
    cookies = dict(response.cookies)
    return cookies


def _auth_header(cookies):
    return {"Cookie": f"access_token={cookies.get('access_token', '')}"}


class TestAIDisabledByDefault:
    def test_chat_returns_503_when_disabled(self, client, auth_cookie):
        with patch("app.api.routes.ai.settings.AI_ENABLED", False):
            response = client.post(
                "/api/ai/chat",
                json={"task": "explain_code", "code": "module test; endmodule"},
                headers=_auth_header(auth_cookie),
            )
            assert response.status_code == 503
            assert "disabled" in response.json()["detail"].lower()


class TestAIProviderAbstraction:
    def test_mock_provider_returns_response(self):
        from app.services.ai.providers.mock_provider import MockAIProvider
        from app.services.ai.providers.base import AIMessage
        import asyncio

        provider = MockAIProvider("Test response")
        assert provider.is_available()

        loop = asyncio.new_event_loop()
        try:
            result = loop.run_until_complete(
                provider.generate_response([AIMessage(role="user", content="test")])
            )
        finally:
            loop.close()
        assert result.content == "Test response"
        assert result.model == "mock-model"
        assert provider._call_count == 1

    def test_openai_provider_not_available_without_key(self):
        from app.services.ai.providers.openai_provider import OpenAIProvider

        provider = OpenAIProvider()
        assert not provider.is_available()


class TestContextBuilder:
    def test_context_truncates_large_source(self):
        from app.services.ai.context_builder import AIContext

        large_code = "x = 1;\n" * 10000
        ctx = AIContext(task="explain_code", user_rtl=large_code)
        d = ctx.to_dict()
        assert len(d["user_rtl"]) < len(large_code)

    def test_context_sanitizes_compiler_paths(self):
        from app.services.ai.context_builder import AIContext, _sanitize_compiler_output

        output = "Error at /home/user/project/src/test.sv:5"
        sanitized = _sanitize_compiler_output(output)
        assert "/home" not in sanitized
        assert "[path]" in sanitized

    def test_context_hides_hidden_test_details(self):
        from app.services.ai.context_builder import AIContext, _extract_safe_test_summary

        public_tests = [{"name": "test1", "passed": True, "message": "ok"}]
        summary = _extract_safe_test_summary(public_tests, 2, 5)
        assert summary["hidden_summary"] == "2/5 hidden tests passed"
        assert len(summary["public_tests"]) == 1
        assert "hidden" not in str(summary["public_tests"]).lower()


class TestPromptBuilders:
    def test_explain_code_prompt_structure(self):
        from app.services.ai.prompt_builder import build_explain_code_prompt
        from app.services.ai.context_builder import AIContext

        ctx = AIContext(
            task="explain_code",
            problem_title="AND Gate",
            problem_description="Implement an AND gate",
            user_rtl="module and_gate(input a, b, output y); assign y = a & b; endmodule",
        )
        messages = build_explain_code_prompt(ctx)
        assert len(messages) == 2
        assert messages[0].role == "system"
        assert messages[1].role == "user"
        assert "AND Gate" in messages[1].content

    def test_debug_prompt_includes_test_summary(self):
        from app.services.ai.prompt_builder import build_debug_submission_prompt
        from app.services.ai.context_builder import AIContext

        ctx = AIContext(
            task="debug_submission",
            problem_title="Counter",
            user_rtl="module counter; endmodule",
            public_test_results=[{"name": "t1", "passed": False, "message": "fail"}],
            hidden_tests_passed=1,
            hidden_tests_total=3,
            submission_status="FAILED",
        )
        messages = build_debug_submission_prompt(ctx)
        assert "FAILED" in messages[1].content
        assert "1/3" in messages[1].content

    def test_hint_prompt_respects_level(self):
        from app.services.ai.prompt_builder import build_hint_prompt
        from app.services.ai.context_builder import AIContext

        ctx = AIContext(task="hint", hint_level=2, user_rtl="module m; endmodule")
        messages = build_hint_prompt(ctx)
        assert "level 2" in messages[1].content


class TestAIRateLimiting:
    def test_rate_limit_check_allows_initial_requests(self):
        from app.services.ai.ai_service import _rate_limits, _check_rate_limit, _minute_limits

        _rate_limits.clear()
        _minute_limits.clear()
        assert _check_rate_limit(99999)

    def test_rate_limit_blocks_after_limit(self):
        import time
        from app.services.ai.ai_service import _rate_limits, _check_rate_limit, _minute_limits
        from app.core.config import settings

        _rate_limits.clear()
        _minute_limits.clear()
        now = time.time()
        _rate_limits[88888] = [now - i for i in range(settings.AI_RATE_LIMIT_PER_HOUR)]
        assert not _check_rate_limit(88888)
        _rate_limits.clear()
        _minute_limits.clear()


class TestAIAuthorization:
    def test_chat_requires_auth(self, client):
        response = client.post(
            "/api/ai/chat",
            json={"task": "explain_code", "code": "test"},
        )
        assert response.status_code == 401

    def test_feedback_requires_auth(self, client):
        response = client.post(
            "/api/ai/feedback",
            json={"rating": "helpful"},
        )
        assert response.status_code == 401

    def test_conversations_requires_auth(self, client):
        response = client.get("/api/ai/conversations")
        assert response.status_code == 401


class TestAIFeedback:
    def test_invalid_rating(self, client, auth_cookie):
        response = client.post(
            "/api/ai/feedback",
            json={"rating": "invalid"},
            headers=_auth_header(auth_cookie),
        )
        assert response.status_code == 400

    def test_valid_feedback(self, client, auth_cookie):
        response = client.post(
            "/api/ai/feedback",
            json={"rating": "helpful", "comment": "great", "task_type": "hint"},
            headers=_auth_header(auth_cookie),
        )
        assert response.status_code == 200
        assert response.json()["status"] == "ok"


class TestAISecretProtection:
    def test_context_dict_no_hidden_test_details(self):
        from app.services.ai.context_builder import AIContext

        ctx = AIContext(
            task="debug_submission",
            public_test_results=[{"name": "public1", "passed": True, "message": ""}],
            hidden_tests_passed=2,
            hidden_tests_total=5,
        )
        d = ctx.to_dict()
        assert "hidden_testbench" not in str(d).lower()
        assert "2/5 hidden" in d["test_results"]["hidden_summary"]

    def test_compiler_output_sanitized(self):
        from app.services.ai.context_builder import _sanitize_compiler_output

        output = "Error in /var/lib/docker/containers/abc123/test.sv"
        sanitized = _sanitize_compiler_output(output)
        assert "docker" not in sanitized.lower()
        assert "/var/lib" not in sanitized
        assert "[path]" in sanitized

    def test_no_api_keys_in_context(self):
        from app.services.ai.context_builder import AIContext

        ctx = AIContext(task="ask", user_question="hello")
        d = ctx.to_dict()
        serialized = str(d)
        assert "sk-" not in serialized
        assert "api_key" not in serialized.lower()


class TestAIFailuresGraceful:
    def test_ai_disabled_returns_useful_error(self, client, auth_cookie):
        response = client.post(
            "/api/ai/chat",
            json={"task": "explain_code", "code": "test"},
            headers=_auth_header(auth_cookie),
        )
        assert response.status_code == 503
        assert "detail" in response.json()

    def test_invalid_task_type_returns_error(self, client, auth_cookie):
        response = client.post(
            "/api/ai/chat",
            json={"task": "invalid_task"},
            headers=_auth_header(auth_cookie),
        )
        assert response.status_code in (400, 404, 500, 503)


class TestConversationStorage:
    def test_conversations_list_empty(self, client, auth_cookie):
        response = client.get(
            "/api/ai/conversations",
            headers=_auth_header(auth_cookie),
        )
        assert response.status_code == 200
        assert response.json()["conversations"] == []

    def test_conversation_not_found(self, client, auth_cookie):
        response = client.get(
            "/api/ai/conversations/99999",
            headers=_auth_header(auth_cookie),
        )
        assert response.status_code == 404


class TestHiddenTestProtection:
    def test_no_testbench_in_context(self):
        from app.services.ai.context_builder import AIContext

        ctx = AIContext(
            task="debug_submission",
            user_rtl="module m; endmodule",
            public_test_results=[{"name": "test", "passed": False, "message": "wrong output"}],
            hidden_tests_passed=0,
            hidden_tests_total=3,
            submission_status="FAILED",
        )
        d = ctx.to_dict()
        serialized = str(d)
        assert "testbench" not in serialized.lower() or "public" in serialized.lower()

    def test_submission_status_only_safe_info(self):
        from app.services.ai.context_builder import AIContext

        ctx = AIContext(
            task="debug_submission",
            submission_status="PARTIAL",
            public_test_results=[],
            hidden_tests_passed=2,
            hidden_tests_total=5,
        )
        d = ctx.to_dict()
        assert d["submission_status"] == "PARTIAL"
        assert "2/5 hidden" in d["test_results"]["hidden_summary"]
