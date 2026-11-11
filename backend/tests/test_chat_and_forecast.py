import app.api.chat as chat_module
from helpers import create_supplier


async def test_chat_returns_answer_and_records_history(
    client, admin_headers, monkeypatch
):
    async def fake_answer(question: str):
        return {
            "question": question,
            "answer": "Net 45 days from invoice receipt.",
            "sources": [
                {"document": "02_PRC-POG-002.md", "chunk": "Net 45 days", "score": 0.91}
            ],
            "confidence": 91.0,
            "degraded": False,
        }

    monkeypatch.setattr(chat_module.rag_service, "answer", fake_answer)

    response = await client.post(
        "/api/chat",
        json={"question": "What are the payment terms?"},
        headers=admin_headers,
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["answer"] == "Net 45 days from invoice receipt."
    assert body["confidence"] == 91.0
    assert body["degraded"] is False

    history = await client.get("/api/history", headers=admin_headers)
    assert history.status_code == 200
    assert len(history.json()) == 1
    assert history.json()[0]["question"] == "What are the payment terms?"


async def test_chat_marks_degraded_fallback(client, admin_headers, monkeypatch):
    async def fake_answer(question: str):
        return {
            "question": question,
            "answer": "AI summarisation is not configured, so here are excerpts...",
            "sources": [],
            "confidence": 80.0,
            "degraded": True,
        }

    monkeypatch.setattr(chat_module.rag_service, "answer", fake_answer)
    response = await client.post(
        "/api/chat", json={"question": "Anything?"}, headers=admin_headers
    )
    assert response.status_code == 200
    assert response.json()["degraded"] is True


async def test_chat_failure_does_not_leak_internals(
    client, admin_headers, monkeypatch
):
    async def boom(question: str):
        raise RuntimeError("database password is hunter2")

    monkeypatch.setattr(chat_module.rag_service, "answer", boom)

    response = await client.post(
        "/api/chat", json={"question": "Hello"}, headers=admin_headers
    )
    assert response.status_code == 500
    assert "hunter2" not in response.text
    assert "temporarily unavailable" in response.json()["detail"]


async def test_price_forecast(client, admin_headers):
    response = await client.post(
        "/api/forecast",
        json={
            "forecast_type": "price",
            "parameters": {"historical_prices": [100, 110, 120, 130], "periods": 2},
        },
        headers=admin_headers,
    )
    assert response.status_code == 200, response.text
    body = response.json()
    assert len(body["result"]["forecast"]) == 2
    assert body["result"]["method"] in {"linear_regression", "moving_average"}


async def test_price_forecast_with_insufficient_data(client, admin_headers):
    response = await client.post(
        "/api/forecast",
        json={"forecast_type": "price", "parameters": {"historical_prices": [100]}},
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert response.json()["result"]["method"] == "insufficient_data"


async def test_risk_forecast_requires_existing_supplier(client, admin_headers):
    missing = await client.post(
        "/api/forecast",
        json={"forecast_type": "risk", "supplier_id": 999},
        headers=admin_headers,
    )
    assert missing.status_code == 404

    supplier = await create_supplier(
        client, admin_headers, "Risky Co", delivery_score=40.0, quality_score=40.0
    )
    response = await client.post(
        "/api/forecast",
        json={
            "forecast_type": "risk",
            "supplier_id": supplier["id"],
            "parameters": {"late_deliveries": 4, "total_orders": 10},
        },
        headers=admin_headers,
    )
    assert response.status_code == 200
    assert response.json()["result"]["risk_level"] == "high"


async def test_unknown_forecast_type_is_rejected(client, admin_headers):
    response = await client.post(
        "/api/forecast",
        json={"forecast_type": "astrology", "parameters": {}},
        headers=admin_headers,
    )
    assert response.status_code == 422


async def test_smart_buy_ranks_suppliers(client, admin_headers):
    await create_supplier(
        client, admin_headers, "Best", delivery_score=95.0, quality_score=95.0
    )
    await create_supplier(
        client, admin_headers, "Worst", delivery_score=60.0, quality_score=60.0
    )

    response = await client.get("/api/forecast/smart-buy", headers=admin_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["top_supplier"]["name"] == "Best"
    assert body["all_scores"][0]["name"] == "Best"


async def test_forecast_history_pagination(client, admin_headers):
    for _ in range(3):
        await client.post(
            "/api/forecast",
            json={
                "forecast_type": "price",
                "parameters": {"historical_prices": [100, 110], "periods": 1},
            },
            headers=admin_headers,
        )

    response = await client.get(
        "/api/forecast", params={"limit": 2}, headers=admin_headers
    )
    assert response.status_code == 200
    assert len(response.json()) == 2
