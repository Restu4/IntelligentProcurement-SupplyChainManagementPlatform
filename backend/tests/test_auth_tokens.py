"""Refresh-token lifecycle: rotation, expiry, logout and reuse detection."""

from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from app.database.postgres import async_session_factory
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.utils.auth import decode_access_token, hash_refresh_token


async def _login(client, username="admin", password="admin123"):
    response = await client.post(
        "/api/login", json={"username": username, "password": password}
    )
    assert response.status_code == 200, response.text
    return response.json()


async def _refresh(client, refresh_token):
    return await client.post("/api/refresh", json={"refresh_token": refresh_token})


async def test_login_returns_access_and_refresh_tokens(client):
    body = await _login(client)

    assert body["token_type"] == "bearer"
    assert body["expires_in"] == 3600
    assert body["access_token"].count(".") == 2
    # Opaque token, not a JWT: it must not be usable as an access token.
    assert "." not in body["refresh_token"]
    assert decode_access_token(body["access_token"])["type"] == "access"


async def test_refresh_rotates_tokens_and_returns_usable_access_token(client):
    first = await _login(client)
    response = await _refresh(client, first["refresh_token"])

    assert response.status_code == 200, response.text
    second = response.json()
    assert second["refresh_token"] != first["refresh_token"]

    me = await client.get(
        "/api/me", headers={"Authorization": f"Bearer {second['access_token']}"}
    )
    assert me.status_code == 200
    assert me.json()["username"] == "admin"


async def test_reusing_revoked_token_revokes_the_whole_family(client):
    first = await _login(client)
    second = (await _refresh(client, first["refresh_token"])).json()

    reuse = await _refresh(client, first["refresh_token"])
    assert reuse.status_code == 401
    assert "revoked" in reuse.json()["detail"].lower()

    # The replacement issued before the theft was detected is dead too.
    after = await _refresh(client, second["refresh_token"])
    assert after.status_code == 401
    assert "revoked" in after.json()["detail"].lower()


async def test_unknown_refresh_token_is_rejected(client):
    response = await _refresh(client, "not-a-real-refresh-token")
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()


async def test_expired_refresh_token_is_rejected(client):
    raw = "expired-refresh-token-value"
    async with async_session_factory() as db:
        user = (
            await db.execute(select(User).where(User.username == "admin"))
        ).scalar_one()
        db.add(
            RefreshToken(
                user_id=user.id,
                token_hash=hash_refresh_token(raw),
                expires_at=datetime.now(timezone.utc) - timedelta(minutes=1),
            )
        )
        await db.commit()

    response = await _refresh(client, raw)
    assert response.status_code == 401
    assert "expired" in response.json()["detail"].lower()


async def test_logout_revokes_refresh_token(client):
    tokens = await _login(client)

    response = await client.post(
        "/api/logout", json={"refresh_token": tokens["refresh_token"]}
    )
    assert response.status_code == 204

    again = await _refresh(client, tokens["refresh_token"])
    assert again.status_code == 401


async def test_refresh_token_is_not_accepted_as_access_token(client):
    tokens = await _login(client)
    response = await client.get(
        "/api/me", headers={"Authorization": f"Bearer {tokens['refresh_token']}"}
    )
    assert response.status_code == 401


async def test_refresh_token_is_stored_hashed(client):
    tokens = await _login(client)
    async with async_session_factory() as db:
        stored = (
            await db.execute(select(RefreshToken))
        ).scalars().all()

    assert stored
    hashes = {row.token_hash for row in stored}
    assert tokens["refresh_token"] not in hashes
    assert hash_refresh_token(tokens["refresh_token"]) in hashes
