# API Documentation
## SmartProcure AI — REST API Reference

**Base URL:** `http://localhost:8000`

**Authentication:** Bearer Token (JWT)

**Pagination:** list endpoints accept `limit` (1–200, default 50) and `offset`
(default 0). `/api/purchase-orders` and `/api/budgets` return a page envelope:

```json
{
  "items": [],
  "total": 0,
  "limit": 50,
  "offset": 0
}
```

Other list endpoints return a plain array of items.

---

## 1. Authentication

### POST /api/login
Authenticate and receive JWT token.

**Request:**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

### POST /api/register
Create a new user account.

> **Security note:** `role` is not accepted from this endpoint. Every public
> registration is created as `viewer`; an administrator must promote the
> account directly in the database.

**Request:**
```json
{
  "username": "procurement_manager",
  "email": "manager@company.com",
  "password": "securepass123",
  "full_name": "Restu Mahi"
}
```

**Response (201):**
```json
{
  "id": 1,
  "username": "procurement_manager",
  "email": "manager@company.com",
  "full_name": "Restu Mahi",
  "role": "viewer",
  "is_active": true
}
```

### GET /api/me
Get current authenticated user info.

**Headers:** `Authorization: Bearer <token>`

---

## 2. AI Chat

### POST /api/chat
Ask a question to SmartProcure AI.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "question": "Who is the best supplier?"
}
```

**Response (200):**
```json
{
  "question": "Who is the best supplier?",
  "answer": "Based on the Supplier Evaluation Report, PT ABC is the Best Supplier 2025 with a Delivery Score of 95 and Quality Score of 90.",
  "sources": [
    {
      "document": "supplier_report.txt",
      "chunk": "SUPPLIER EVALUATION REPORT\n\nPT ABC\n\nDelivery Score: 95\nQuality Score: 90\n\nStatus:\nBest Supplier 2025",
      "score": 0.9231
    }
  ],
  "confidence": 92.31,
  "degraded": false
}
```

`degraded` is `true` when Gemini is unavailable and the answer is an extractive
fallback built from the retrieved chunks. When `false`, the text came from the
LLM.

### GET /api/history?limit=20&offset=0
Get chat history for current user, newest first.

**Headers:** `Authorization: Bearer <token>`

---

## 3. Document Management

### POST /api/upload
Upload a document (PDF, DOCX, TXT, MD).

> **Admin only.** Viewers receive `403 Forbidden`.

**Headers:** `Authorization: Bearer <token>`
**Content-Type:** `multipart/form-data`

**Parameters:**
| Field | Type | Required |
|-------|------|----------|
| file | File | Yes |
| description | String | No |

**Response (201):**
```json
{
  "id": 1,
  "filename": "abc123.pdf",
  "original_filename": "Supplier Report Q4.pdf",
  "file_type": "pdf",
  "file_size": 2456789,
  "chunk_count": 24,
  "message": "Successfully processed Supplier Report Q4.pdf with 24 chunks"
}
```

### GET /api/documents?limit=50&offset=0
List uploaded documents, newest first.

**Headers:** `Authorization: Bearer <token>`

### GET /api/documents/{id}
Get document details.

**Headers:** `Authorization: Bearer <token>`

### DELETE /api/documents/{id}
Delete the document and its vectors (and the stored file).

> **Admin only.**

**Headers:** `Authorization: Bearer <token>`

---

## 4. Suppliers

### GET /api/suppliers
List suppliers with optional filters.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | String | `active`, `inactive`, `blacklisted` |
| risk_level | String | `low`, `medium`, `high` |
| category | String | Supplier category |
| q | String | Case-insensitive name search |
| limit | Integer | 1–200 (default 50) |
| offset | Integer | ≥ 0 (default 0) |

### GET /api/suppliers/{id}
Get supplier details.

### POST /api/suppliers
Create a new supplier. **Admin only.**

**Request:**
```json
{
  "name": "PT ABC",
  "category": "Raw Materials",
  "status": "active",
  "delivery_score": 95,
  "quality_score": 90
}
```

### GET /api/suppliers/{id}/risk
Rule-based risk assessment for a supplier.

**Response:**
```json
{
  "supplier_id": 1,
  "supplier_name": "PT ABC",
  "risk_level": "low",
  "risk_score": 0.12,
  "factors": []
}
```

---

## 5. Purchase Orders

Approval levels come from `data/02_PRC-POG-002_PO_Guidelines.md` and are
assigned by the backend from the amount:

| Amount (IDR) | Approval level |
|:-------------|:---------------|
| ≤ 25,000,000 | Procurement Manager |
| ≤ 150,000,000 | Senior Procurement Manager |
| ≤ 750,000,000 | Procurement Director |
| > 750,000,000 | CFO + Procurement Director |

Allowed status transitions:

```
draft ──▶ pending ──▶ approved ──▶ completed
  │  ▲        │
  │  └── rejected ◀──┘
  │
  └──▶ cancelled   (also reachable from pending and approved)
```

`completed` and `cancelled` are terminal; `rejected` can be reopened as `draft`.

### GET /api/purchase-orders
Paginated PO list.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | String | Filter by workflow status |
| supplier_id | Integer | Filter by supplier |
| q | String | Search PO number, description, or supplier name |
| limit | Integer | 1–200 (default 50) |
| offset | Integer | ≥ 0 (default 0) |

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "po_number": "PO-2026-0001",
      "supplier_id": 1,
      "supplier_name": "PT Sukses Makmur Sentosa",
      "user_id": 1,
      "description": "Raw material Q1",
      "amount": 320000000,
      "status": "approved",
      "approval_level": "Procurement Director",
      "notes": null,
      "created_at": "2026-01-10T09:30:00Z",
      "updated_at": "2026-01-10T09:30:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### GET /api/purchase-orders/{id}
Get a single purchase order.

### POST /api/purchase-orders
Create a purchase order. **Admin only.**

`po_number` is optional; when omitted the backend generates the next
`PO-<year>-<sequence>` value. Creating a PO directly as `approved` or `completed`
is rejected — use the workflow.

**Request:**
```json
{
  "supplier_id": 1,
  "description": "Raw material Q1",
  "amount": 320000000,
  "notes": "Urgent",
  "status": "draft"
}
```

Errors: `404` unknown supplier, `400` blacklisted supplier or invalid initial
status, `409` duplicate PO number.

### PATCH /api/purchase-orders/{id}
Update fields and/or advance the status. **Admin only.**

```json
{ "status": "pending" }
```

Rules:
- Illegal transitions return `409`.
- Changing `amount` on an approved/completed PO by more than 10% resets the
  status to `pending` and recomputes the approval level.

### DELETE /api/purchase-orders/{id}
Delete a PO. **Admin only.** `approved` and `completed` POs cannot be deleted
(`409`) — cancel them instead.

---

## 6. Budgets

### GET /api/budgets
Paginated budget list.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:** `fiscal_year`, `department` (partial match), `limit`,
`offset`.

**Response (200):**
```json
{
  "items": [
    {
      "id": 1,
      "department": "IT Infrastructure",
      "fiscal_year": 2025,
      "total_budget": 25000000000,
      "allocated": 18500000000,
      "remaining": 6500000000,
      "utilization": 74.0,
      "created_at": "2026-01-10T09:30:00Z",
      "updated_at": "2026-01-10T09:30:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

`remaining` and `utilization` (percentage) are computed by the server.

### GET /api/budgets/summary?fiscal_year=2025
Aggregate totals for a fiscal year (defaults to the current UTC year).

```json
{
  "fiscal_year": 2025,
  "departments": 5,
  "total_budget": 115000000000,
  "allocated": 91500000000,
  "remaining": 23500000000,
  "utilization": 79.57
}
```

### GET /api/budgets/{id}
Get a single budget.

### POST /api/budgets
Create a budget. **Admin only.**

```json
{
  "department": "IT Infrastructure",
  "fiscal_year": 2025,
  "total_budget": 25000000000,
  "allocated": 18500000000
}
```

`(department, fiscal_year)` is unique (case-insensitive check) and returns `409`
on duplicates. `allocated` may not exceed `total_budget`.

### PATCH /api/budgets/{id}
Update a budget. **Admin only.** Remaining/utilization are recomputed; allocated
above total is rejected with `400`.

### DELETE /api/budgets/{id}
Delete a budget. **Admin only.**

---

## 7. Forecasting

### POST /api/forecast
Run an AI forecast.

**Headers:** `Authorization: Bearer <token>`

**Price Forecast Request:**
```json
{
  "supplier_id": 1,
  "forecast_type": "price",
  "parameters": {
    "historical_prices": [120, 125, 118, 130, 135, 140],
    "periods": 3
  }
}
```

**Response:**
```json
{
  "supplier_id": 1,
  "forecast_type": "price",
  "result": {
    "forecast": [142.5, 145.3, 148.1],
    "method": "linear_regression",
    "confidence": 0.924
  },
  "confidence": 0.924
}
```

**Risk Assessment Request:**
```json
{
  "forecast_type": "risk",
  "supplier_id": 1,
  "parameters": {
    "late_deliveries": 2,
    "total_orders": 20
  }
}
```

**Budget Recommendation Request:**
```json
{
  "forecast_type": "budget",
  "parameters": {
    "total_budget": 50000000000,
    "allocated": 35000000000,
    "pending_requests": [5000000000, 3000000000]
  }
}
```

### GET /api/forecast?limit=20&offset=0
Get forecast history, newest first. Optional `supplier_id` filter.

### GET /api/forecast/smart-buy
Get AI-powered supplier recommendation.

**Response:**
```json
{
  "recommendation": "Recommended supplier: PT Karya Mandiri with composite score 0.94",
  "top_supplier": {
    "name": "PT Karya Mandiri",
    "score": 0.94,
    "delivery_score": 92,
    "quality_score": 94
  }
}
```

---

## 8. Health

### GET /api/health
System health check.

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "chromadb": "connected",
  "gemini": "configured"
}
```

---

## 9. Error Responses

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 404 Not Found
```json
{
  "detail": "Document not found"
}
```

### 500 Internal Server Error
Internal details are logged, never returned to the client:

```json
{
  "detail": "The AI assistant is temporarily unavailable. Please try again."
}
```

### 409 Conflict
Used for duplicate resources and illegal state transitions:

```json
{
  "detail": "Cannot move a purchase order from 'draft' to 'approved'"
}
```

---

## 10. Swagger UI

Interactive API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
