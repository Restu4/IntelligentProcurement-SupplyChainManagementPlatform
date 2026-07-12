# API Documentation
## SmartProcure AI — REST API Reference

**Base URL:** `http://localhost:8000`

**Authentication:** Bearer Token (JWT)

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

**Request:**
```json
{
  "username": "procurement_manager",
  "email": "manager@company.com",
  "password": "securepass123",
  "full_name": "Restu Mahi",
  "role": "manager"
}
```

**Response (201):**
```json
{
  "id": 1,
  "username": "procurement_manager",
  "email": "manager@company.com",
  "full_name": "Restu Mahi",
  "role": "manager",
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
  "confidence": 92.31
}
```

### GET /api/history?limit=20
Get chat history for current user.

**Headers:** `Authorization: Bearer <token>`

---

## 3. Document Management

### POST /api/upload
Upload a document (PDF, DOCX, TXT).

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

### GET /api/documents
List all uploaded documents.

**Headers:** `Authorization: Bearer <token>`

### GET /api/documents/{id}
Get document details.

**Headers:** `Authorization: Bearer <token>`

### DELETE /api/documents/{id}
Delete document and its vectors.

**Headers:** `Authorization: Bearer <token>`

---

## 4. Suppliers

### GET /api/suppliers
List suppliers with optional filters.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
| Parameter | Type |
|-----------|------|
| status | String |
| risk_level | String |
| category | String |

### GET /api/suppliers/{id}
Get supplier details.

### POST /api/suppliers
Create a new supplier.

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
AI-powered risk assessment for a supplier.

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

## 5. Forecasting

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

### GET /api/forecast?limit=20
Get forecast history.

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

## 6. Health

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

## 7. Error Responses

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
```json
{
  "detail": "Chat processing failed: <error message>"
}
```

---

## 8. Swagger UI

Interactive API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
