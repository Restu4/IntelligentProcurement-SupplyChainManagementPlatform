import re

import pytest

from helpers import create_supplier


async def create_po(client, headers, supplier_id, amount=10_000_000, **overrides):
    payload = {
        "supplier_id": supplier_id,
        "description": "Office supplies",
        "amount": amount,
    }
    payload.update(overrides)
    response = await client.post("/api/purchase-orders", json=payload, headers=headers)
    assert response.status_code == 201, response.text
    return response.json()


@pytest.mark.parametrize(
    "amount,expected",
    [
        (1_000_000, "Procurement Manager"),
        (25_000_000, "Procurement Manager"),
        (25_000_001, "Senior Procurement Manager"),
        (150_000_000, "Senior Procurement Manager"),
        (150_000_001, "Procurement Director"),
        (750_000_000, "Procurement Director"),
        (750_000_001, "CFO + Procurement Director"),
    ],
)
async def test_approval_band_matches_policy(client, admin_headers, amount, expected):
    supplier = await create_supplier(client, admin_headers)
    po = await create_po(client, admin_headers, supplier["id"], amount=amount)
    assert po["approval_level"] == expected


async def test_create_generates_sequential_po_numbers(client, admin_headers):
    supplier = await create_supplier(client, admin_headers)
    first = await create_po(client, admin_headers, supplier["id"])
    second = await create_po(client, admin_headers, supplier["id"])

    assert re.fullmatch(r"PO-\d{4}-\d{4}", first["po_number"])
    assert first["po_number"] != second["po_number"]
    assert int(second["po_number"][-4:]) == int(first["po_number"][-4:]) + 1


async def test_create_rejects_unknown_or_blacklisted_supplier(client, admin_headers):
    missing = await client.post(
        "/api/purchase-orders",
        json={"supplier_id": 4242, "amount": 1_000_000},
        headers=admin_headers,
    )
    assert missing.status_code == 404

    blocked = await create_supplier(
        client, admin_headers, "Blocked Vendor", status="blacklisted"
    )
    response = await client.post(
        "/api/purchase-orders",
        json={"supplier_id": blocked["id"], "amount": 1_000_000},
        headers=admin_headers,
    )
    assert response.status_code == 400


async def test_create_cannot_skip_approval_workflow(client, admin_headers):
    supplier = await create_supplier(client, admin_headers)
    response = await client.post(
        "/api/purchase-orders",
        json={
            "supplier_id": supplier["id"],
            "amount": 1_000_000,
            "status": "approved",
        },
        headers=admin_headers,
    )
    assert response.status_code == 400


async def test_duplicate_custom_po_number_is_conflict(client, admin_headers):
    supplier = await create_supplier(client, admin_headers)
    await create_po(client, admin_headers, supplier["id"], po_number="PO-X-0001")
    response = await client.post(
        "/api/purchase-orders",
        json={
            "supplier_id": supplier["id"],
            "amount": 1_000_000,
            "po_number": "PO-X-0001",
        },
        headers=admin_headers,
    )
    assert response.status_code == 409


async def test_list_pagination_and_filters(client, admin_headers):
    supplier = await create_supplier(client, admin_headers)
    await create_po(client, admin_headers, supplier["id"], status="draft")
    await create_po(client, admin_headers, supplier["id"], status="pending")
    await create_po(client, admin_headers, supplier["id"], status="draft")

    page = await client.get(
        "/api/purchase-orders",
        params={"limit": 2, "offset": 1},
        headers=admin_headers,
    )
    assert page.status_code == 200
    body = page.json()
    assert body["total"] == 3
    assert len(body["items"]) == 2
    assert body["limit"] == 2 and body["offset"] == 1

    pending = await client.get(
        "/api/purchase-orders", params={"status": "pending"}, headers=admin_headers
    )
    assert pending.json()["total"] == 1

    searched = await client.get(
        "/api/purchase-orders",
        params={"q": supplier["name"]},
        headers=admin_headers,
    )
    assert searched.json()["total"] == 3


async def test_status_workflow_and_illegal_transition(client, admin_headers):
    supplier = await create_supplier(client, admin_headers)
    po = await create_po(client, admin_headers, supplier["id"])

    approved_early = await client.patch(
        f"/api/purchase-orders/{po['id']}",
        json={"status": "approved"},
        headers=admin_headers,
    )
    assert approved_early.status_code == 409

    pending = await client.patch(
        f"/api/purchase-orders/{po['id']}",
        json={"status": "pending"},
        headers=admin_headers,
    )
    assert pending.status_code == 200

    approved = await client.patch(
        f"/api/purchase-orders/{po['id']}",
        json={"status": "approved"},
        headers=admin_headers,
    )
    assert approved.status_code == 200
    assert approved.json()["status"] == "approved"


async def test_large_amendment_requires_reapproval(client, admin_headers):
    supplier = await create_supplier(client, admin_headers)
    po = await create_po(client, admin_headers, supplier["id"], amount=10_000_000)

    await client.patch(
        f"/api/purchase-orders/{po['id']}",
        json={"status": "pending"},
        headers=admin_headers,
    )
    await client.patch(
        f"/api/purchase-orders/{po['id']}",
        json={"status": "approved"},
        headers=admin_headers,
    )

    amended = await client.patch(
        f"/api/purchase-orders/{po['id']}",
        json={"amount": 12_000_000},
        headers=admin_headers,
    )
    assert amended.status_code == 200
    body = amended.json()
    assert body["status"] == "pending"
    assert body["approval_level"] == "Procurement Manager"


async def test_delete_rules(client, admin_headers):
    supplier = await create_supplier(client, admin_headers)
    draft = await create_po(client, admin_headers, supplier["id"])

    deleted = await client.delete(
        f"/api/purchase-orders/{draft['id']}", headers=admin_headers
    )
    assert deleted.status_code == 204

    approved = await create_po(client, admin_headers, supplier["id"])
    await client.patch(
        f"/api/purchase-orders/{approved['id']}",
        json={"status": "pending"},
        headers=admin_headers,
    )
    await client.patch(
        f"/api/purchase-orders/{approved['id']}",
        json={"status": "approved"},
        headers=admin_headers,
    )
    blocked = await client.delete(
        f"/api/purchase-orders/{approved['id']}", headers=admin_headers
    )
    assert blocked.status_code == 409


async def test_viewer_cannot_write(client, admin_headers, viewer_headers):
    supplier = await create_supplier(client, admin_headers)
    response = await client.post(
        "/api/purchase-orders",
        json={"supplier_id": supplier["id"], "amount": 1_000_000},
        headers=viewer_headers,
    )
    assert response.status_code == 403
