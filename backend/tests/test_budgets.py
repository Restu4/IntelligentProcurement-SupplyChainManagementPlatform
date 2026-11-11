async def create_budget(client, headers, department="IT", fiscal_year=2025,
                        total_budget=10_000_000, allocated=4_000_000):
    response = await client.post(
        "/api/budgets",
        json={
            "department": department,
            "fiscal_year": fiscal_year,
            "total_budget": total_budget,
            "allocated": allocated,
        },
        headers=headers,
    )
    assert response.status_code == 201, response.text
    return response.json()


async def test_create_computes_remaining_and_utilization(client, admin_headers):
    budget = await create_budget(client, admin_headers)
    assert budget["remaining"] == 6_000_000
    assert budget["utilization"] == 40.0


async def test_duplicate_department_and_year_is_conflict(client, admin_headers):
    await create_budget(client, admin_headers, department="Finance")
    response = await client.post(
        "/api/budgets",
        json={
            "department": "finance",
            "fiscal_year": 2025,
            "total_budget": 5_000_000,
            "allocated": 0,
        },
        headers=admin_headers,
    )
    assert response.status_code == 409


async def test_summary_aggregates_departments(client, admin_headers):
    await create_budget(client, admin_headers, "IT", total_budget=10_000_000, allocated=4_000_000)
    await create_budget(client, admin_headers, "Ops", total_budget=20_000_000, allocated=5_000_000)

    response = await client.get(
        "/api/budgets/summary", params={"fiscal_year": 2025}, headers=admin_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["departments"] == 2
    assert body["total_budget"] == 30_000_000
    assert body["allocated"] == 9_000_000
    assert body["remaining"] == 21_000_000
    assert body["utilization"] == 30.0


async def test_update_recalculates_remaining(client, admin_headers):
    budget = await create_budget(client, admin_headers)

    response = await client.patch(
        f"/api/budgets/{budget['id']}",
        json={"total_budget": 20_000_000, "allocated": 12_000_000},
        headers=admin_headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["remaining"] == 8_000_000
    assert body["utilization"] == 60.0


async def test_allocated_cannot_exceed_total(client, admin_headers):
    budget = await create_budget(client, admin_headers)
    response = await client.patch(
        f"/api/budgets/{budget['id']}",
        json={"allocated": 11_000_000},
        headers=admin_headers,
    )
    assert response.status_code == 400


async def test_list_pagination_and_filter(client, admin_headers):
    await create_budget(client, admin_headers, "IT")
    await create_budget(client, admin_headers, "Ops")
    await create_budget(client, admin_headers, "Legal", fiscal_year=2024)

    page = await client.get(
        "/api/budgets",
        params={"fiscal_year": 2025, "limit": 1},
        headers=admin_headers,
    )
    body = page.json()
    assert body["total"] == 2
    assert len(body["items"]) == 1

    filtered = await client.get(
        "/api/budgets", params={"department": "leg"}, headers=admin_headers
    )
    assert filtered.json()["total"] == 1


async def test_delete_budget(client, admin_headers):
    budget = await create_budget(client, admin_headers)
    response = await client.delete(
        f"/api/budgets/{budget['id']}", headers=admin_headers
    )
    assert response.status_code == 204

    missing = await client.get(
        f"/api/budgets/{budget['id']}", headers=admin_headers
    )
    assert missing.status_code == 404


async def test_viewer_cannot_write_budgets(client, viewer_headers):
    response = await client.post(
        "/api/budgets",
        json={"department": "Nope", "fiscal_year": 2025, "total_budget": 1, "allocated": 0},
        headers=viewer_headers,
    )
    assert response.status_code == 403
