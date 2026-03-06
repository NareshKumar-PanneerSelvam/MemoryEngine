import asyncio
import json
import logging
import re
import time
from collections import deque
from datetime import UTC, date, datetime, timedelta
from typing import Any

import google.generativeai as genai

from app.core.config import settings

logger = logging.getLogger(__name__)


PROMPTS = {
    "rephrase": (
        "Rephrase the following text while maintaining the original meaning.\n"
        "Return ONLY JSON in this format: {\"result\":\"...\"}\n\n"
        "Text:\n{text}"
    ),
    "enhance": (
        "Enhance the following text by adding relevant details and examples.\n"
        "Return ONLY JSON in this format: {\"result\":\"...\"}\n\n"
        "Text:\n{text}"
    ),
    "simplify": (
        "Simplify the following text using easier vocabulary and shorter sentences.\n"
        "Return ONLY JSON in this format: {\"result\":\"...\"}\n\n"
        "Text:\n{text}"
    ),
    "generate_questions": (
        "Generate exactly {count} technical interview questions from the content.\n"
        "Return ONLY JSON in this format: {\"questions\":[\"...\", \"...\"]}\n\n"
        "Content:\n{text}"
    ),
    "generate_flashcards": (
        "Generate exactly {count} flashcards from the content.\n"
        "Return ONLY JSON in this format: "
        "{\"flashcards\":[{\"question\":\"...\",\"answer\":\"...\"}]}\n\n"
        "Content:\n{text}"
    ),
    "image_to_markdown": (
        "Convert the handwritten image into clean Markdown.\n"
        "If image quality is too poor, set low_quality to true and provide guidance.\n"
        "Return ONLY JSON in this format: "
        "{\"markdown\":\"...\",\"confidence\":0.0,\"low_quality\":false,\"guidance\":\"...\"}"
    ),
}


class AIServiceError(Exception):
    def __init__(self, message: str, status_code: int = 503, retry_after: int | None = None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.retry_after = retry_after


class AIRateLimitError(AIServiceError):
    def __init__(self, retry_after: int):
        super().__init__(
            f"AI service rate limit exceeded. Please try again in {retry_after} seconds.",
            status_code=429,
            retry_after=retry_after,
        )


class InMemoryRateLimiter:
    def __init__(self, per_minute: int, per_day: int):
        self._per_minute = per_minute
        self._per_day = per_day
        self._minute_windows: dict[str, deque[float]] = {}
        self._daily_counts: dict[str, tuple[date, int]] = {}
        self._lock = asyncio.Lock()

    async def acquire(self, key: str) -> None:
        async with self._lock:
            now = time.time()
            minute_window = self._minute_windows.setdefault(key, deque())
            while minute_window and now - minute_window[0] >= 60:
                minute_window.popleft()

            if len(minute_window) >= self._per_minute:
                retry_after = max(1, int(60 - (now - minute_window[0])))
                raise AIRateLimitError(retry_after=retry_after)

            today = datetime.now(UTC).date()
            day, count = self._daily_counts.get(key, (today, 0))
            if day != today:
                day = today
                count = 0

            if count >= self._per_day:
                tomorrow = datetime.combine(today + timedelta(days=1), datetime.min.time(), tzinfo=UTC)
                retry_after = max(1, int((tomorrow - datetime.now(UTC)).total_seconds()))
                raise AIRateLimitError(retry_after=retry_after)

            minute_window.append(now)
            self._daily_counts[key] = (day, count + 1)


class AIService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self._model = genai.GenerativeModel(
            model_name=settings.GEMINI_MODEL,
            generation_config=genai.GenerationConfig(
                max_output_tokens=settings.GEMINI_MAX_TOKENS,
                temperature=settings.GEMINI_TEMPERATURE,
            ),
        )
        self._limiter = InMemoryRateLimiter(
            per_minute=settings.AI_RATE_LIMIT_PER_MINUTE,
            per_day=settings.AI_RATE_LIMIT_PER_DAY,
        )

    @staticmethod
    def _extract_json(raw: str) -> Any:
        text = raw.strip()
        if not text:
            raise ValueError("Empty response from AI model")

        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        fenced_match = re.search(r"```json\s*(.*?)\s*```", text, flags=re.DOTALL | re.IGNORECASE)
        if fenced_match:
            return json.loads(fenced_match.group(1))

        candidate_match = re.search(r"(\{.*\}|\[.*\])", text, flags=re.DOTALL)
        if candidate_match:
            return json.loads(candidate_match.group(1))

        raise ValueError("AI response does not contain valid JSON")

    async def _generate_content(self, content: Any) -> str:
        response = await asyncio.to_thread(self._model.generate_content, content)
        response_text = getattr(response, "text", None)
        if not response_text:
            raise ValueError("AI model returned no text output")
        return response_text

    async def _call_json_operation(
        self,
        *,
        user_id: str,
        operation: str,
        content: Any,
        max_retries: int = 3,
    ) -> dict[str, Any]:
        for attempt in range(max_retries):
            try:
                await self._limiter.acquire(user_id)
                started = time.perf_counter()
                raw = await self._generate_content(content)
                duration_ms = int((time.perf_counter() - started) * 1000)
                parsed = self._extract_json(raw)
                if not isinstance(parsed, dict):
                    raise ValueError("Expected JSON object")
                logger.info(
                    "ai_operation_success operation=%s user_id=%s duration_ms=%s attempt=%s",
                    operation,
                    user_id,
                    duration_ms,
                    attempt + 1,
                )
                return parsed
            except AIRateLimitError:
                raise
            except Exception as exc:
                logger.warning(
                    "ai_operation_retry operation=%s user_id=%s attempt=%s error=%s",
                    operation,
                    user_id,
                    attempt + 1,
                    str(exc),
                )
                if attempt == max_retries - 1:
                    raise AIServiceError(
                        f"AI {operation} failed after {max_retries} attempts: {str(exc)}",
                        status_code=503,
                    )
                await asyncio.sleep(2**attempt)

        raise AIServiceError(f"AI {operation} failed unexpectedly", status_code=503)

    async def rephrase_text(self, *, user_id: str, text: str) -> str:
        payload = await self._call_json_operation(
            user_id=user_id,
            operation="rephrase",
            content=PROMPTS["rephrase"].format(text=text),
        )
        result = str(payload.get("result", "")).strip()
        if not result:
            raise AIServiceError("Invalid AI response for rephrase", status_code=502)
        return result

    async def enhance_text(self, *, user_id: str, text: str) -> str:
        payload = await self._call_json_operation(
            user_id=user_id,
            operation="enhance",
            content=PROMPTS["enhance"].format(text=text),
        )
        result = str(payload.get("result", "")).strip()
        if not result:
            raise AIServiceError("Invalid AI response for enhance", status_code=502)
        return result

    async def simplify_text(self, *, user_id: str, text: str) -> str:
        payload = await self._call_json_operation(
            user_id=user_id,
            operation="simplify",
            content=PROMPTS["simplify"].format(text=text),
        )
        result = str(payload.get("result", "")).strip()
        if not result:
            raise AIServiceError("Invalid AI response for simplify", status_code=502)
        return result

    async def generate_questions(self, *, user_id: str, text: str, count: int) -> list[str]:
        payload = await self._call_json_operation(
            user_id=user_id,
            operation="generate_questions",
            content=PROMPTS["generate_questions"].format(text=text, count=count),
        )
        questions = payload.get("questions")
        if not isinstance(questions, list):
            raise AIServiceError("Invalid AI response for question generation", status_code=502)
        normalized = [str(q).strip() for q in questions if str(q).strip()]
        if not normalized:
            raise AIServiceError("AI did not return any questions", status_code=502)
        return normalized

    async def generate_flashcards(self, *, user_id: str, text: str, count: int) -> list[dict[str, str]]:
        payload = await self._call_json_operation(
            user_id=user_id,
            operation="generate_flashcards",
            content=PROMPTS["generate_flashcards"].format(text=text, count=count),
        )
        flashcards = payload.get("flashcards")
        if not isinstance(flashcards, list):
            raise AIServiceError("Invalid AI response for flashcard generation", status_code=502)

        normalized: list[dict[str, str]] = []
        for item in flashcards:
            if not isinstance(item, dict):
                continue
            question = str(item.get("question", "")).strip()
            answer = str(item.get("answer", "")).strip()
            if question and answer:
                normalized.append({"question": question, "answer": answer})

        if not normalized:
            raise AIServiceError("AI did not return valid flashcards", status_code=502)
        return normalized

    async def image_to_markdown(self, *, user_id: str, image_bytes: bytes, mime_type: str) -> tuple[str, float]:
        payload = await self._call_json_operation(
            user_id=user_id,
            operation="image_to_markdown",
            content=[
                PROMPTS["image_to_markdown"],
                {"mime_type": mime_type, "data": image_bytes},
            ],
        )

        low_quality = bool(payload.get("low_quality", False))
        if low_quality:
            guidance = str(payload.get("guidance", "")).strip() or (
                "Image quality is too low for reliable OCR. Please upload a clearer image."
            )
            raise AIServiceError(guidance, status_code=400)

        markdown = str(payload.get("markdown", "")).strip()
        if not markdown:
            raise AIServiceError("AI OCR response did not include markdown output", status_code=502)

        confidence_raw = payload.get("confidence", 0.0)
        try:
            confidence = float(confidence_raw)
        except (TypeError, ValueError):
            confidence = 0.0
        confidence = max(0.0, min(1.0, confidence))
        return markdown, confidence


ai_service = AIService()
