import logging
import httpx
from app.core.config import settings
from app.services.ai.providers.base import AIProvider, AIMessage, AIResponse

logger = logging.getLogger(__name__)


class GroqProvider(AIProvider):
    """High-speed AI Tutor provider powered by Groq API."""

    def __init__(self):
        pass

    def _get_api_key(self) -> str:
        return (getattr(settings, "GROQ_API_KEY", "") or settings.AI_API_KEY or "").strip()

    def is_available(self) -> bool:
        return bool(self._get_api_key() and settings.AI_ENABLED)

    async def generate_response(
        self,
        messages: list[AIMessage],
        temperature: float = 0.3,
        max_tokens: int = 2000,
    ) -> AIResponse:
        api_key = self._get_api_key()
        if not api_key:
            raise RuntimeError(
                "Groq API key not configured. Please set GROQ_API_KEY in your environment."
            )

        model = (getattr(settings, "GROQ_MODEL", "") or settings.AI_MODEL or "llama-3.3-70b-versatile").strip()
        if model.startswith("gpt-"):
            model = "llama-3.3-70b-versatile"

        api_messages = [{"role": m.role, "content": m.content} for m in messages]

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": api_messages,
            "temperature": temperature,
            "max_tokens": min(max_tokens, settings.AI_MAX_OUTPUT_TOKENS),
        }

        async with httpx.AsyncClient(timeout=45.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code != 200:
                err_text = resp.text
                logger.error("Groq API error (%d): %s", resp.status_code, err_text)
                raise RuntimeError(f"Groq API returned error {resp.status_code}: {err_text}")

            data = resp.json()

        choice = data.get("choices", [{}])[0]
        msg = choice.get("message", {})
        usage = data.get("usage", {})

        return AIResponse(
            content=msg.get("content", ""),
            model=data.get("model", model),
            tokens_used=usage.get("total_tokens", 0),
            finish_reason=choice.get("finish_reason", ""),
        )
