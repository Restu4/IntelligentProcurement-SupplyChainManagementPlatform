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

**Rate limiting:** every `/api` endpoint except `/api/health` is limited per
client IP by an in-memory sliding window (default 120 requests / 60 seconds).
`POST /api/login` has a stricter limit (default 10 / 60 seconds). Exceeding a
limit returns `429 Too Many Requests` with a `Retry-After` header. Limits are
per process; with multiple Uvicorn workers the effective limit is multiplied.

---

## 1. Authentication

### POST /api/login
Authenticate and receive an access token plus a rotating refresh token.

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
  "refresh_token": "kM3...opaque...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

The refresh token is opaque (`secrets.token_urlsafe`), stored only as a SHA-256
hash, and never accepted as a bearer token.

### POST /api/refresh
Exchange a refresh token for a new access/refresh pair. The old refresh token is
revoked immediately. Reusing an already-revoked token is treated as theft and
revokes every active refresh token for that user.

**Request:**
```json
{
  "refresh_token": "kM3...opaque..."
}
```

**Response (200):** same shape as `/api/login`.

`401` is returned for unknown, expired, or revoked tokens.

### POST /api/logout
Revoke a refresh token. Returns `204 No Content`.

**Request:**
```json
{
  "refresh_token": "kM3...opaque..."
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

## 8. Analytics and Reports

Both endpoints aggregate live data in Python so SQLite and PostgreSQL return
identical results. `fiscal_year` defaults to the current UTC year. "Spend" means
the sum of purchase orders in `approved` or `completed` status; suppliers are
not year-scoped.

### GET /api/analytics/overview?fiscal_year=2026
Return totals, monthly buckets, category spend, and a status breakdown.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "fiscal_year": 2026,
  "totals": {
    "total_budget": 100000000,
    "allocated": 40000000,
    "remaining": 60000000,
    "utilization": 40.0,
    "spend": 30000000,
    "pending_amount": 0,
    "purchase_orders": 3,
    "avg_order_value": 15000000,
    "active_suppliers": 2,
    "high_risk_suppliers": 1,
    "documents": 5,
    "pending_pos": 0,
    "completed_pos": 1
  },
  "monthly": [
    { "month": "Jan", "month_number": 1, "orders": 0, "spend": 0 },
    { "month": "Nov", "month_number": 11, "orders": 3, "spend": 30000000 }
  ],
  "categories": [
    { "category": "Raw Materials", "spend": 30000000, "share": 100.0 }
  ],
  "status_breakdown": [
    { "status": "draft", "count": 1, "amount": 5000000 }
  ],
  "generated_at": "2026-11-11T08:00:00Z"
}
```

`monthly` always contains 12 entries.

### GET /api/reports/summary?fiscal_year=2026
Return the same totals plus row-level data for CSV exports: department budgets,
supplier performance, and the purchase-order register.

**Response:** `{ fiscal_year, generated_at, totals, budgets[], suppliers[],
purchase_orders[] }`. The frontend downloads these arrays as CSV; the API does
not render PDF files.

---

## 9. Audit Logs

### GET /api/audit-logs
Append-only security and business audit trail. **Admin only.**

**Query parameters:** `action`, `entity_type`, `user_id`, `limit` (1–200),
`offset`.

**Response (200):** page envelope of
`{ id, user_id, username, action, entity_type, entity_id, detail, ip_address, created_at }`.

Recorded actions include `login`, `login_failed`, `refresh_failed`,
`refresh_reuse_detected`, `logout`, `register`, `purchase_order.created`,
`purchase_order.updated`, `purchase_order.deleted`, `budget.created`,
`budget.updated`, `budget.deleted`, `supplier.created`, `document.uploaded`, and
`document.deleted`. `detail` is a JSON string with context; `username` is
denormalised so the trail survives user deletion.

---

## 10. Health

### GET /api/health
System health check (not rate limited).

**Response:**
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "database": "connected",
  "chromadb": "connected",
  "gemini": "configured",
  "embedding_model": "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"
}
```

---

## 11. Error Responses

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

Protected endpoints answer `401` (with a `WWW-Authenticate: Bearer` header) when the
`Authorization` header is missing, malformed, expired or signed with another
secret. `403` is reserved for a valid session that lacks the required role, so a
client can tell "sign in again" apart from "you are not allowed to do this".

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

### 429 Too Many Requests
Returned by the rate-limit middleware and the stricter login limiter:

```json
{
  "detail": "Too many requests. Please slow down."
}
```

The response includes `Retry-After` (seconds).

---

## 12. Swagger UI

Interactive API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
