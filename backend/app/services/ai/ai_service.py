from __future__ import annotations

import json
import logging
import time
from collections import defaultdict
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from app.core.config import settings
from app.services.ai.context_builder import AIContext, _sanitize_compiler_output, _truncate
from app.services.ai.prompt_builder import PROMPT_BUILDERS
from app.services.ai.providers.base import AIProvider, AIMessage, AIResponse
from app.services.ai.providers.groq_provider import GroqProvider
from app.services.ai.providers.openai_provider import OpenAIProvider

logger = logging.getLogger(__name__)

_rate_limits: dict[int, list[float]] = defaultdict(list)
_minute_limits: dict[int, list[float]] = defaultdict(list)


def _get_provider() -> AIProvider:
    provider_name = (getattr(settings, "AI_PROVIDER", "") or "groq").lower()
    if provider_name == "openai":
        return OpenAIProvider()
    return GroqProvider()


def _check_rate_limit(user_id: str) -> bool:
    now = time.time()
    hour_cutoff = now - 3600
    minute_cutoff = now - 60

    _rate_limits[user_id] = [t for t in _rate_limits[user_id] if t > hour_cutoff]
    _minute_limits[user_id] = [t for t in _minute_limits[user_id] if t > minute_cutoff]

    if len(_rate_limits[user_id]) >= settings.AI_RATE_LIMIT_PER_HOUR:
        return False
    if len(_minute_limits[user_id]) >= settings.AI_RATE_LIMIT_PER_MINUTE:
        return False
    return True


def _record_usage(user_id: str) -> None:
    now = time.time()
    _rate_limits[user_id].append(now)
    _minute_limits[user_id].append(now)


def _build_waveform_summary(waveform_data: dict) -> dict:
    signals = []
    key_transitions = []
    for sig in waveform_data.get("signals", []):
        signals.append(sig.get("name", ""))
        changes = sig.get("changes", [])
        for ch in changes[:5]:
            key_transitions.append({
                "time": ch.get("time"),
                "signal": sig.get("name"),
                "value": ch.get("value"),
            })
    return {
        "signals": signals[:20],
        "key_transitions": key_transitions[:30],
        "duration": waveform_data.get("duration", 0),
        "timescale": waveform_data.get("timescale", "1ns"),
    }


async def handle_ai_request(
    db: Session,
    user_id: str,
    task: str,
    context: dict[str, Any],
) -> dict:
    if not settings.AI_ENABLED:
        return {"error": "AI assistant is currently disabled.", "available": False}

    provider = _get_provider()
    if not provider.is_available():
        return {"error": "AI provider is not available. Please try again later.", "available": False}

    if not _check_rate_limit(user_id):
        return {
            "error": "Rate limit exceeded. Please wait before making another request.",
            "available": True,
            "rate_limited": True,
        }

    prompt_builder = PROMPT_BUILDERS.get(task)
    if not prompt_builder:
        return {"error": f"Unknown task: {task}", "available": True}

    ctx = AIContext(
        task=task,
        language=context.get("language", "systemverilog"),
        problem_title=context.get("problem_title", ""),
        problem_description=context.get("problem_description", ""),
        problem_constraints=context.get("problem_constraints", ""),
        user_rtl=context.get("user_rtl", ""),
        compiler_error=context.get("compiler_error", ""),
        public_test_results=context.get("public_test_results", []),
        hidden_tests_passed=0,
        hidden_tests_total=context.get("hidden_tests_total", 0),
        submission_status=context.get("submission_status", ""),
        waveform_summary=_build_waveform_summary(context.get("waveform_data", {}))
        if context.get("waveform_data")
        else {},
        learning_context=context.get("learning_context", {}),
        user_question=context.get("user_question", ""),
        concept_tags=context.get("concept_tags", []),
        hint_level=context.get("hint_level", 1),
    )

    messages = prompt_builder(ctx)

    try:
        response = await provider.generate_response(
            messages=messages,
            temperature=0.3,
            max_tokens=settings.AI_MAX_OUTPUT_TOKENS,
        )
        _record_usage(user_id)

        return {
            "response": response.content,
            "model": response.model,
            "tokens_used": response.tokens_used,
            "available": True,
        }
    except Exception as e:
        logger.error("AI request failed: %s", e)
        return {"error": "AI assistant encountered an error. Please try again.", "available": True}


def save_conversation(
    db: Session,
    user_id: str,
    task: str,
    context: dict,
    response: str,
    problem_id: int | None = None,
    lesson_id: int | None = None,
) -> int | None:
    try:
        from app.db.models import AIConversation, AIMessage as AIMessageModel

        conv = AIConversation(
            user_id=user_id,
            problem_id=problem_id,
            lesson_id=lesson_id,
            task_type=task,
        )
        db.add(conv)
        db.flush()

        context_summary = {
            "task": task,
            "problem_title": context.get("problem_title", ""),
            "user_question": context.get("user_question", ""),
        }
        user_msg = AIMessageModel(
            conversation_id=conv.id,
            role="user",
            content=json.dumps(context_summary),
        )
        db.add(user_msg)

        ai_msg = AIMessageModel(
            conversation_id=conv.id,
            role="assistant",
            content=response,
        )
        db.add(ai_msg)
        db.commit()
        return conv.id
    except Exception as e:
        logger.error("Failed to save conversation: %s", e)
        db.rollback()
        return None
