from helpers import create_supplier


async def test_admin_can_create_supplier(client, admin_headers):
    supplier = await create_supplier(client, admin_headers)
    assert supplier["name"] == "Test Supplier"
    assert supplier["status"] == "active"


async def test_viewer_cannot_create_supplier(client, viewer_headers):
    response = await client.post(
        "/api/suppliers", json={"name": "Blocked"}, headers=viewer_headers
    )
    assert response.status_code == 403


async def test_list_suppliers_filters_and_search(client, admin_headers):
    await create_supplier(client, admin_headers, "Alpha Mining", category="Raw Materials")
    await create_supplier(client, admin_headers, "Beta Logistics", status="inactive")
    await create_supplier(client, admin_headers, "Gamma Risk", risk_level="high")

    everything = await client.get("/api/suppliers", headers=admin_headers)
    assert everything.status_code == 200
    assert len(everything.json()) == 3

    status_filtered = await client.get(
        "/api/suppliers", params={"status": "inactive"}, headers=admin_headers
    )
    assert [item["name"] for item in status_filtered.json()] == ["Beta Logistics"]

    risk_filtered = await client.get(
        "/api/suppliers", params={"risk_level": "high"}, headers=admin_headers
    )
    assert [item["name"] for item in risk_filtered.json()] == ["Gamma Risk"]

    searched = await client.get(
        "/api/suppliers", params={"q": "alpha"}, headers=admin_headers
    )
    assert [item["name"] for item in searched.json()] == ["Alpha Mining"]


async def test_supplier_pagination(client, admin_headers):
    for index in range(5):
        await create_supplier(client, admin_headers, f"Supplier {index}")

    page = await client.get(
        "/api/suppliers", params={"limit": 2, "offset": 2}, headers=admin_headers
    )
    assert page.status_code == 200
    assert len(page.json()) == 2


async def test_supplier_detail_and_risk(client, admin_headers):
    supplier = await create_supplier(
        client, admin_headers, "Risky", delivery_score=50.0, quality_score=55.0
    )

    detail = await client.get(
        f"/api/suppliers/{supplier['id']}", headers=admin_headers
    )
    assert detail.status_code == 200
    assert detail.json()["name"] == "Risky"

    risk = await client.get(
        f"/api/suppliers/{supplier['id']}/risk", headers=admin_headers
    )
    assert risk.status_code == 200
    body = risk.json()
    assert body["risk_level"] == "high"
    assert "low_delivery_score" in body["factors"]


async def test_missing_supplier_returns_404(client, admin_headers):
    response = await client.get("/api/suppliers/9999", headers=admin_headers)
    assert response.status_code == 404

    risk = await client.get("/api/suppliers/9999/risk", headers=admin_headers)
    assert risk.status_code == 404
