# Testing Plan
## SmartProcure AI — Quality Assurance Document

---

## 1. Testing Strategy

This document outlines the comprehensive testing strategy for SmartProcure AI across all layers: backend API, RAG pipeline, frontend UI, mobile app, and integration testing.

---

## 2. Test Levels

### 2.1 Unit Testing

| Module | Framework | Test Areas |
|--------|-----------|------------|
| Parser Service | pytest | Text extraction (TXT, PDF, DOCX) |
| Chunk Service | pytest | Chunk size, overlap, boundary cases |
| Embedding Service | pytest | Embedding dimension, batch processing |
| LLM Service | pytest | Prompt construction, response parsing |
| Forecast Service | pytest | Price prediction, risk classification |

### 2.2 API Testing

| Endpoint | Test Cases |
|----------|------------|
| POST /api/login | Valid credentials, invalid credentials, inactive user |
| POST /api/chat | Valid question, empty question, unauthenticated |
| POST /api/upload | TXT upload, PDF upload, DOCX upload, invalid file type |
| GET /api/documents | List documents, empty list |
| GET /api/suppliers | List suppliers, filter by status |
| POST /api/forecast | Price forecast, risk assessment, budget recommendation |
| GET /api/health | System health check |

### 2.3 RAG Pipeline Testing

| Test | Expected Behavior |
|------|-------------------|
| Question with exact match | Return accurate answer with high confidence |
| Question with partial match | Return answer with moderate confidence |
| Question with no match | Return "not found" message with low confidence |
| Hallucination threshold | < 70% confidence → refuse to answer |
| Source citation | Each answer includes document source |

### 2.4 Frontend Testing

| Component | Test Areas |
|-----------|------------|
| Login Page | Form validation, error display, navigation |
| Dashboard | Widget rendering, data display |
| AI Chat | Message rendering, typing animation, source panel |
| Supplier Table | Sorting, filtering, search |
| Document Upload | Drag-drop, file selection, progress |
| Theme Toggle | Dark/light mode switching |

### 2.5 Mobile Testing

| Screen | Test Areas |
|--------|------------|
| Login | Authentication flow, form validation |
| Dashboard | Stat cards, quick actions |
| Chat | Message send/receive, suggestions |
| Upload | File picker, upload flow |

---

## 3. Sample Test Cases

### 3.1 API Test — Chat Endpoint

```python
import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_chat_success():
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Login
        login_res = await client.post("/api/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = login_res.json()["access_token"]

        # Chat
        res = await client.post(
            "/api/chat",
            json={"question": "Who is the best supplier?"},
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res.status_code == 200
        data = res.json()
        assert "answer" in data
        assert "sources" in data
        assert "confidence" in data
```

### 3.2 RAG Pipeline Test

```python
def test_rag_confidence_threshold():
    rag = RagService()
    # Test with query that has no matching documents
    result = rag.answer("This topic does not exist in knowledge base")
    assert result["confidence"] < 70
    assert "not exist" in result["answer"].lower()
```

### 3.3 Chunk Service Test

```python
def test_chunk_size():
    chunker = ChunkService()
    text = "A" * 1200
    chunks = chunker.chunk_text(text, chunk_size=500, overlap=100)
    assert len(chunks) >= 2
    assert all(len(c) <= 500 for c in chunks)
```

---

## 4. Performance Testing

| Test | Target | Tool |
|------|--------|------|
| API Response Time | < 3 seconds | Locust/k6 |
| Concurrent Users | 100 simultaneous | Locust/k6 |
| Document Processing | < 10 seconds per file | Manual timing |
| Vector Search | < 1 second for 10K vectors | ChromaDB benchmark |

---

## 5. Security Testing

| Test | Description |
|------|-------------|
| JWT Token Expiry | Verify token expires after configured time |
| SQL Injection | Test with malicious SQL strings in inputs |
| XSS | Test with script tags in chat questions |
| File Upload Security | Test with malicious file types |
| Authentication Bypass | Test endpoints without token |

---

## 6. Test Environment

```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx locust

# Run all tests
pytest tests/

# Run specific test
pytest tests/test_rag.py -v

# Performance test with k6
k6 run tests/load_test.js
```
