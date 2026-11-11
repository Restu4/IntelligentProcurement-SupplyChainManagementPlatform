from helpers import login


async def test_health_is_public_and_reports_database(client):
    response = await client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert body["database"] == "connected"


async def test_login_returns_token(client):
    token = await login(client, "admin", "admin123")
    assert token.count(".") == 2


async def test_login_rejects_wrong_password(client):
    response = await client.post(
        "/api/login", json={"username": "admin", "password": "wrong-password"}
    )
    assert response.status_code == 401
    assert "Invalid" in response.json()["detail"]


async def test_me_requires_token(client):
    response = await client.get("/api/me")
    assert response.status_code in (401, 403)


async def test_me_returns_profile(client, admin_headers):
    response = await client.get("/api/me", headers=admin_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["username"] == "admin"
    assert body["role"] == "admin"


async def test_invalid_token_is_rejected(client):
    response = await client.get(
        "/api/me", headers={"Authorization": "Bearer not-a-real-token"}
    )
    assert response.status_code == 401


async def test_registration_cannot_escalate_to_admin(client):
    response = await client.post(
        "/api/register",
        json={
            "username": "newuser",
            "email": "newuser@test.local",
            "password": "secret123",
            "full_name": "New User",
            "role": "admin",
        },
    )
    assert response.status_code == 201, response.text
    body = response.json()
    assert body["role"] == "viewer"


async def test_duplicate_registration_is_conflict(client):
    await client.post(
        "/api/register",
        json={
            "username": "dupe",
            "email": "dupe@test.local",
            "password": "secret123",
        },
    )
    response = await client.post(
        "/api/register",
        json={
            "username": "dupe",
            "email": "dupe@test.local",
            "password": "secret123",
        },
    )
    assert response.status_code == 409
