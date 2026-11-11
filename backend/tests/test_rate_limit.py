"""Rate limiting: middleware behaviour and the limiter itself."""

import pytest

from app.config.settings import settings
from app.utils.rate_limit import SlidingWindowLimiter, reset_limiters


@pytest.fixture(autouse=True)
def _rate_limit_settings(monkeypatch):
    monkeypatch.setattr(settings, "RATE_LIMIT_ENABLED", True)
    monkeypatch.setattr(settings, "RATE_LIMIT_REQUESTS", 1000)
    monkeypatch.setattr(settings, "RATE_LIMIT_LOGIN_REQUESTS", 1000)
    monkeypatch.setattr(settings, "RATE_LIMIT_WINDOW_SECONDS", 60)
    reset_limiters()
    yield
    reset_limiters()


async def test_general_api_limit_returns_429_with_retry_after(
    client, monkeypatch
):
    monkeypatch.setattr(settings, "RATE_LIMIT_REQUESTS", 3)
    reset_limiters()

    for _ in range(3):
        response = await client.get("/api/suppliers")
        assert response.status_code in (401, 403)

    blocked = await client.get("/api/suppliers")
    assert blocked.status_code == 429
    assert blocked.json()["detail"]
    assert int(blocked.headers["retry-after"]) >= 1


async def test_health_check_is_not_rate_limited(client, monkeypatch):
    monkeypatch.setattr(settings, "RATE_LIMIT_REQUESTS", 1)
    reset_limiters()

    for _ in range(3):
        response = await client.get("/api/health")
        assert response.status_code == 200


async def test_login_has_a_stricter_limit(client, monkeypatch):
    monkeypatch.setattr(settings, "RATE_LIMIT_LOGIN_REQUESTS", 2)
    reset_limiters()

    payload = {"username": "admin", "password": "wrong-password"}
    assert (await client.post("/api/login", json=payload)).status_code == 401
    assert (await client.post("/api/login", json=payload)).status_code == 401

    blocked = await client.post("/api/login", json=payload)
    assert blocked.status_code == 429
    assert "login attempts" in blocked.json()["detail"].lower()


async def test_limit_is_disabled_by_configuration(client, monkeypatch):
    monkeypatch.setattr(settings, "RATE_LIMIT_ENABLED", False)
    monkeypatch.setattr(settings, "RATE_LIMIT_LOGIN_REQUESTS", 1)
    reset_limiters()

    payload = {"username": "admin", "password": "wrong-password"}
    for _ in range(3):
        assert (await client.post("/api/login", json=payload)).status_code == 401


def test_sliding_window_limiter_resets_after_window():
    limiter = SlidingWindowLimiter()

    assert limiter.hit("client", limit=2, window_seconds=60) == (True, 0.0)
    assert limiter.hit("client", limit=2, window_seconds=60) == (True, 0.0)

    allowed, retry_after = limiter.hit("client", limit=2, window_seconds=60)
    assert allowed is False
    assert retry_after > 0

    limiter.reset()
    assert limiter.hit("client", limit=2, window_seconds=60) == (True, 0.0)


def test_sliding_window_limiter_isolates_clients():
    limiter = SlidingWindowLimiter()

    assert limiter.hit("a", limit=1, window_seconds=60)[0] is True
    assert limiter.hit("b", limit=1, window_seconds=60)[0] is True
    assert limiter.hit("a", limit=1, window_seconds=60)[0] is False
