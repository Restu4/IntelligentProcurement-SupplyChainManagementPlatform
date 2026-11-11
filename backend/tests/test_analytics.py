"""Analytics overview and report summary aggregation."""

from datetime import datetime, timezone

from helpers import create_supplier


def _current_year() -> int:
    return datetime.now(timezone.utc).year


async def _create_budget(client, headers, total=100_000_000, allocated=40_000_000):
    response = await client.post(
        "/api/budgets",
        json={
            "department": "Operations",
            "fiscal_year": _current_year(),
            "total_budget": total,
            "allocated": allocated,
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


async def _create_po(client, headers, supplier_id, amount):
    response = await client.post(
        "/api/purchase-orders",
        json={
            "supplier_id": supplier_id,
            "description": "Analytics fixture",
            "amount": amount,
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


async def _move_to(client, headers, po_id, status):
    response = await client.patch(
        f"/api/purchase-orders/{po_id}", json={"status": status}, headers=headers
    )
    assert response.status_code == 200, response.text
    return response.json()


async def _seed_dataset(client, headers):
    await _create_budget(client, headers)

    raw = await create_supplier(client, headers, name="Raw Materials Co")
    risky = await create_supplier(
        client, headers, name="Risky Co", risk_level="high", category="Logistics"
    )

    approved = await _create_po(client, headers, raw["id"], 10_000_000)
    await _move_to(client, headers, approved["id"], "pending")
    await _move_to(client, headers, approved["id"], "approved")

    completed = await _create_po(client, headers, raw["id"], 20_000_000)
    await _move_to(client, headers, completed["id"], "pending")
    await _move_to(client, headers, completed["id"], "approved")
    await _move_to(client, headers, completed["id"], "completed")

    draft = await _create_po(client, headers, risky["id"], 5_000_000)

    return {"approved": approved, "completed": completed, "draft": draft}


async def test_overview_totals_match_seeded_data(client, admin_headers):
    await _seed_dataset(client, admin_headers)

    response = await client.get(
        "/api/analytics/overview", headers=admin_headers
    )
    assert response.status_code == 200, response.text
    body = response.json()

    assert body["fiscal_year"] == _current_year()
    totals = body["totals"]
    assert totals["total_budget"] == 100_000_000
    assert totals["allocated"] == 40_000_000
    assert totals["remaining"] == 60_000_000
    assert totals["utilization"] == 40.0
    # Only approved + completed count as spend.
    assert totals["spend"] == 30_000_000
    assert totals["pending_amount"] == 0
    assert totals["purchase_orders"] == 3
    assert totals["avg_order_value"] == 15_000_000
    assert totals["active_suppliers"] == 2
    assert totals["high_risk_suppliers"] == 1
    assert totals["pending_pos"] == 0
    assert totals["completed_pos"] == 1
    assert body["generated_at"]


async def test_overview_monthly_categories_and_status(client, admin_headers):
    await _seed_dataset(client, admin_headers)

    body = (
        await client.get("/api/analytics/overview", headers=admin_headers)
    ).json()

    assert len(body["monthly"]) == 12
    assert sum(point["orders"] for point in body["monthly"]) == 3
    assert sum(point["spend"] for point in body["monthly"]) == 30_000_000

    categories = {item["category"]: item for item in body["categories"]}
    assert categories["Raw Materials"]["spend"] == 30_000_000
    assert categories["Raw Materials"]["share"] == 100.0
    assert "Logistics" not in categories

    statuses = {item["status"]: item for item in body["status_breakdown"]}
    assert statuses["draft"]["count"] == 1
    assert statuses["approved"]["count"] == 1
    assert statuses["completed"]["count"] == 1
    assert statuses["approved"]["amount"] == 10_000_000


async def test_report_summary_lists_all_rows(client, admin_headers):
    await _seed_dataset(client, admin_headers)

    response = await client.get("/api/reports/summary", headers=admin_headers)
    assert response.status_code == 200, response.text
    body = response.json()

    assert len(body["budgets"]) == 1
    assert body["budgets"][0]["department"] == "Operations"
    assert body["budgets"][0]["utilization"] == 40.0

    assert len(body["suppliers"]) == 2
    assert len(body["purchase_orders"]) == 3
    assert all(row["po_number"] for row in body["purchase_orders"])
    assert all(row["supplier_name"] for row in body["purchase_orders"])
    # SQLite drops tzinfo; the API must still emit an explicit UTC designator.
    assert body["generated_at"].endswith("Z")
    assert body["purchase_orders"][0]["created_at"].endswith("Z")


async def test_fiscal_year_filter_excludes_other_years(client, admin_headers):
    await _seed_dataset(client, admin_headers)

    body = (
        await client.get(
            "/api/analytics/overview",
            params={"fiscal_year": 2000},
            headers=admin_headers,
        )
    ).json()

    assert body["fiscal_year"] == 2000
    assert body["totals"]["total_budget"] == 0
    assert body["totals"]["purchase_orders"] == 0
    assert sum(point["orders"] for point in body["monthly"]) == 0
    assert body["categories"] == []
    # Suppliers are not year-scoped.
    assert body["totals"]["active_suppliers"] == 2


async def test_analytics_and_reports_require_authentication(client):
    analytics = await client.get("/api/analytics/overview")
    reports = await client.get("/api/reports/summary")
    assert analytics.status_code in (401, 403)
    assert reports.status_code in (401, 403)


async def test_viewer_can_read_analytics(client, viewer_headers):
    response = await client.get("/api/analytics/overview", headers=viewer_headers)
    assert response.status_code == 200
