"""Shared pytest fixtures.

Environment variables are set before importing the application so the test
database and JWT secret are used instead of the developer's `.env`.
"""

import os
import sys
import time
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

TEST_DB = BACKEND_DIR / "test_smartprocure.db"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{TEST_DB.as_posix()}"
os.environ["JWT_SECRET_KEY"] = "test-secret-key-" + "x" * 40
os.environ["ENVIRONMENT"] = "test"
os.environ["GEMINI_API_KEY"] = ""
os.environ["CORS_ORIGINS"] = "http://testserver"
# Rate limiting is exercised explicitly in tests/test_rate_limit.py; leaving it
# on would make unrelated tests depend on request count and wall-clock order.
os.environ["RATE_LIMIT_ENABLED"] = "false"

import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402

from app.database.postgres import Base, async_session_factory, close_db, engine  # noqa: E402
from app.models.user import User  # noqa: E402
from app.utils.auth import hash_password  # noqa: E402
from helpers import login  # noqa: E402,F401
from main import app as fastapi_app  # noqa: E402

ADMIN_HASH = hash_password("admin123")
VIEWER_HASH = hash_password("viewer123")


async def _seed_users() -> None:
    async with async_session_factory() as db:
        db.add(
            User(
                username="admin",
                email="admin@test.local",
                hashed_password=ADMIN_HASH,
                full_name="Test Admin",
                role="admin",
                is_active=True,
            )
        )
        db.add(
            User(
                username="viewer",
                email="viewer@test.local",
                hashed_password=VIEWER_HASH,
                full_name="Test Viewer",
                role="viewer",
                is_active=True,
            )
        )
        await db.commit()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    await close_db()
    # Windows can hold the SQLite file open for a moment after close; retry
    # instead of failing the whole session teardown.
    for suffix in ("", "-wal", "-shm"):
        path = Path(str(TEST_DB) + suffix)
        for _ in range(10):
            try:
                if path.exists():
                    path.unlink()
                break
            except PermissionError:
                time.sleep(0.2)


@pytest_asyncio.fixture(autouse=True)
async def _clean_tables(_database):
    async with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            await conn.execute(table.delete())
    await _seed_users()
    yield


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=fastapi_app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client


@pytest_asyncio.fixture
async def admin_headers(client):
    token = await login(client, "admin", "admin123")
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def viewer_headers(client):
    token = await login(client, "viewer", "viewer123")
    return {"Authorization": f"Bearer {token}"}
