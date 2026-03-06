import pytest

from app.services.ai_service import AIRateLimitError, AIService, InMemoryRateLimiter


def test_extract_json_direct_object() -> None:
    payload = AIService._extract_json('{"result":"ok"}')
    assert payload == {"result": "ok"}


def test_extract_json_from_code_fence() -> None:
    payload = AIService._extract_json('```json\n{"questions":["q1"]}\n```')
    assert payload == {"questions": ["q1"]}


def test_extract_json_invalid_raises() -> None:
    with pytest.raises(ValueError):
        AIService._extract_json('not-json-response')


@pytest.mark.asyncio
async def test_rate_limiter_minute_limit() -> None:
    limiter = InMemoryRateLimiter(per_minute=2, per_day=10)
    key = "user-1"

    await limiter.acquire(key)
    await limiter.acquire(key)

    with pytest.raises(AIRateLimitError) as exc:
        await limiter.acquire(key)

    assert exc.value.retry_after is not None
    assert exc.value.retry_after >= 1
