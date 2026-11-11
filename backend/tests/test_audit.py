"""Audit trail: writes from business endpoints and admin-only read access."""

from helpers import create_supplier


async def _create_po(client, headers, supplier_id, amount=10_000_000):
    response = await client.post(
        "/api/purchase-orders",
        json={"supplier_id": supplier_id, "amount": amount},
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


async def test_login_is_audited(client):
    response = await client.post(
        "/api/login", json={"username": "admin", "password": "admin123"}
    )
    assert response.status_code == 200

    logs = await client.get(
        "/api/audit-logs",
        params={"action": "login"},
        headers={"Authorization": f"Bearer {response.json()['access_token']}"},
    )
    assert logs.status_code == 200
    items = logs.json()["items"]
    assert len(items) == 1
    assert items[0]["username"] == "admin"
    assert items[0]["entity_type"] == "auth"


async def test_failed_login_is_audited_without_a_session(client):
    response = await client.post(
        "/api/login", json={"username": "admin", "password": "wrong-password"}
    )
    assert response.status_code == 401

    # A fresh login must still work; the audit write used its own session.
    tokens = await client.post(
        "/api/login", json={"username": "admin", "password": "admin123"}
    )
    assert tokens.status_code == 200

    logs = await client.get(
        "/api/audit-logs",
        params={"action": "login_failed"},
        headers={"Authorization": f"Bearer {tokens.json()['access_token']}"},
    )
    assert logs.status_code == 200
    items = logs.json()["items"]
    assert len(items) == 1
    assert items[0]["username"] == "admin"
    assert "invalid_credentials" in items[0]["detail"]


async def test_purchase_order_changes_are_audited(client, admin_headers):
    supplier = await create_supplier(client, admin_headers)
    po = await _create_po(client, admin_headers, supplier["id"])

    update = await client.patch(
        f"/api/purchase-orders/{po['id']}",
        json={"status": "pending"},
        headers=admin_headers,
    )
    assert update.status_code == 200

    response = await client.get(
        "/api/audit-logs",
        params={"entity_type": "purchase_order"},
        headers=admin_headers,
    )
    assert response.status_code == 200
    body = response.json()
    actions = [item["action"] for item in body["items"]]
    assert "purchase_order.created" in actions
    assert "purchase_order.updated" in actions

    created = next(
        item for item in body["items"] if item["action"] == "purchase_order.created"
    )
    assert created["entity_id"] == str(po["id"])
    assert po["po_number"] in created["detail"]
    assert created["username"] == "admin"


async def test_budget_and_supplier_changes_are_audited(client, admin_headers):
    await create_supplier(client, admin_headers, name="Audited Supplier")
    budget = await client.post(
        "/api/budgets",
        json={
            "department": "Audit",
            "fiscal_year": 2025,
            "total_budget": 10_000_000,
            "allocated": 1_000_000,
        },
        headers=admin_headers,
    )
    assert budget.status_code == 201

    response = await client.get(
        "/api/audit-logs",
        params={"limit": 200},
        headers=admin_headers,
    )
    actions = {item["action"] for item in response.json()["items"]}
    assert {"supplier.created", "budget.created"} <= actions


async def test_audit_logs_support_filtering_and_pagination(client, admin_headers):
    supplier = await create_supplier(client, admin_headers)
    await _create_po(client, admin_headers, supplier["id"], amount=1_000_000)
    await _create_po(client, admin_headers, supplier["id"], amount=2_000_000)

    first = await client.get(
        "/api/audit-logs",
        params={"action": "purchase_order.created", "limit": 1, "offset": 0},
        headers=admin_headers,
    )
    assert first.status_code == 200
    assert first.json()["total"] == 2
    assert len(first.json()["items"]) == 1

    second = await client.get(
        "/api/audit-logs",
        params={"action": "purchase_order.created", "limit": 1, "offset": 1},
        headers=admin_headers,
    )
    assert second.json()["items"][0]["id"] != first.json()["items"][0]["id"]


async def test_audit_logs_require_admin(client, viewer_headers):
    response = await client.get("/api/audit-logs", headers=viewer_headers)
    assert response.status_code == 403


async def test_audit_logs_require_authentication(client):
    response = await client.get("/api/audit-logs")
    assert response.status_code in (401, 403)
