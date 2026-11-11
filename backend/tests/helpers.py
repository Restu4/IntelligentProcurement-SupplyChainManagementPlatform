from httpx import AsyncClient


async def login(client: AsyncClient, username: str, password: str) -> str:
    response = await client.post(
        "/api/login", json={"username": username, "password": password}
    )
    assert response.status_code == 200, response.text
    return response.json()["access_token"]


async def create_supplier(
    client: AsyncClient,
    headers: dict,
    name: str = "Test Supplier",
    **overrides,
) -> dict:
    payload = {
        "name": name,
        "category": "Raw Materials",
        "status": "active",
        "risk_level": "low",
        "delivery_score": 90.0,
        "quality_score": 88.0,
    }
    payload.update(overrides)
    response = await client.post("/api/suppliers", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()
