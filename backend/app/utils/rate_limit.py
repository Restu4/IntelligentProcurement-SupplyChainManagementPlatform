import threading
import time
from collections import deque

from fastapi import HTTPException, Request

from app.config.settings import settings


class SlidingWindowLimiter:
    """In-memory sliding-window limiter.

    This is intentionally per process: it protects a single API instance from
    runaway clients without adding a Redis dependency. Behind multiple workers
    the effective limit is multiplied by the worker count — documented in the
    README.
    """

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._hits: dict[str, deque[float]] = {}

    def hit(
        self,
        key: str,
        limit: int,
        window_seconds: float,
    ) -> tuple[bool, float]:
        """Record a hit. Returns ``(allowed, retry_after_seconds)``."""
        now = time.monotonic()
        cutoff = now - window_seconds

        with self._lock:
            bucket = self._hits.setdefault(key, deque())
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()

            if limit > 0 and len(bucket) >= limit:
                retry_after = max(0.0, bucket[0] + window_seconds - now)
                return False, retry_after

            bucket.append(now)

            # Drop idle keys so the dict does not grow without bound.
            if len(self._hits) > 10_000:
                for stale_key in [
                    k for k, v in self._hits.items() if not v or v[-1] <= cutoff
                ]:
                    self._hits.pop(stale_key, None)

            return True, 0.0

    def reset(self) -> None:
        with self._lock:
            self._hits.clear()


global_limiter = SlidingWindowLimiter()
login_limiter = SlidingWindowLimiter()


def client_key(request) -> str:
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def reset_limiters() -> None:
    global_limiter.reset()
    login_limiter.reset()


def _retry_after_header(retry_after: float) -> str:
    return str(max(1, int(retry_after + 0.999)))


async def login_rate_limit(request: Request) -> None:
    """Stricter limit for credential endpoints (per client IP)."""
    if not settings.RATE_LIMIT_ENABLED:
        return
    allowed, retry_after = login_limiter.hit(
        client_key(request),
        settings.RATE_LIMIT_LOGIN_REQUESTS,
        settings.RATE_LIMIT_WINDOW_SECONDS,
    )
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts. Please try again shortly.",
            headers={"Retry-After": _retry_after_header(retry_after)},
        )
