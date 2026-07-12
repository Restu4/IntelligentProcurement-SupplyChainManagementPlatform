# SmartProcure AI

**Intelligent Procurement & Supply Chain Assistant**

Enterprise-grade backend for procurement knowledge management using RAG (Retrieval-Augmented Generation), semantic search, LLM integration, and AI-powered forecasting.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | FastAPI (Python 3.12+) |
| Database | PostgreSQL + SQLAlchemy (async) |
| Vector DB | ChromaDB |
| Embeddings | Sentence Transformers (`all-MiniLM-L6-v2`) |
| LLM | Google Gemini API |
| Auth | JWT (python-jose + passlib) |
| File Parsing | PyMuPDF, pdfplumber, python-docx |
| Forecasting | scikit-learn, pandas |
| API Docs | Swagger (auto-generated) |

---

## Folder Structure

```
backend/
├── app/
│   ├── api/                # REST API routers
│   │   ├── auth.py         # POST /login, POST /register, GET /me
│   │   ├── chat.py         # POST /chat, GET /history
│   │   ├── documents.py    # POST /upload, GET /documents, DELETE /documents
│   │   ├── suppliers.py    # CRUD suppliers + risk assessment
│   │   ├── forecast.py     # POST /forecast, GET /forecast, GET /forecast/smart-buy
│   │   └── health.py       # GET /health
│   ├── services/           # Business logic layer
│   │   ├── rag_service.py       # RAG pipeline (embed → search → generate)
│   │   ├── embedding_service.py # Sentence Transformer wrapper
│   │   ├── llm_service.py       # Gemini integration
│   │   ├── chunk_service.py     # Text chunking with overlap
│   │   ├── parser_service.py    # PDF/DOCX/TXT extraction
│   │   └── forecast_service.py  # Price, risk, budget, smart-buy forecasting
│   ├── database/
│   │   ├── postgres.py     # SQLAlchemy async engine + session
│   │   └── chromadb.py     # ChromaDB client wrapper
│   ├── models/             # SQLAlchemy ORM models
│   ├── schemas/            # Pydantic request/response models
│   ├── utils/              # Logger, auth utilities
│   └── config/
│       └── settings.py     # Centralized config from .env
├── uploads/                # Uploaded file storage
├── knowledge_base/         # Raw knowledge base documents
├── vectordb/               # ChromaDB persistence
├── alembic/                # Database migrations
├── alembic.ini
├── main.py                 # FastAPI entrypoint
├── requirements.txt
├── .env.example
└── README.md
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Login → JWT token |
| POST | `/api/register` | Register new user |
| GET | `/api/me` | Get current user |

### Chat / RAG
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/chat` | Ask question → RAG answer with sources |
| GET | `/api/history` | Get chat history |

### Document Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload PDF/DOCX/TXT → auto-extract + chunk + embed |
| GET | `/api/documents` | List all documents |
| GET | `/api/documents/{id}` | Get document details |
| DELETE | `/api/documents/{id}` | Delete document |

### Suppliers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/suppliers` | List suppliers (filterable) |
| GET | `/api/suppliers/{id}` | Get supplier details |
| POST | `/api/suppliers` | Create supplier |
| GET | `/api/suppliers/{id}/risk` | Assess supplier risk |

### Forecasting (AI)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/forecast` | Run forecast (price/risk/budget/demand) |
| GET | `/api/forecast` | Get forecast history |
| GET | `/api/forecast/smart-buy` | Smart buy recommendation |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/docs` | Swagger UI |
| GET | `/redoc` | ReDoc UI |

---

## RAG Pipeline

```
User Question
     ↓
  Embedding (Sentence Transformers)
     ↓
  Vector Search (ChromaDB - Top 5 chunks)
     ↓
  Gemini LLM (context + question → answer)
     ↓
  Final Answer + Source Evidence + Confidence Score
```

## Hallucination Protection

If the average similarity score falls below the confidence threshold (default: 0.70), the system returns:

> *"I'm sorry, this information does not exist in the SmartProcure Knowledge Base."*

The system never invents procurement information.

---

## Quick Start

### 1. Clone & Environment

```bash
git clone <repo-url>
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configuration

```bash
cp .env.example .env
# Edit .env with your:
# - DATABASE_URL (PostgreSQL)
# - JWT_SECRET_KEY (random secure string)
# - GEMINI_API_KEY (from Google AI Studio)
```

### 3. Database

```bash
# Create PostgreSQL database
createdb smartprocure

# Run migrations
alembic upgrade head

# OR auto-create tables on first app startup
```

### 4. Seed Knowledge Base

```bash
cp ../data/*.txt knowledge_base/
```

### 5. Run

```bash
python main.py
# → http://localhost:8000
# → Swagger: http://localhost:8000/docs
```

---

## API Examples

### Login
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
# Response: {"access_token": "eyJ...", "token_type": "bearer"}
```

### Chat
```bash
curl -X POST http://localhost:8000/api/chat \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"question": "Siapa supplier terbaik?"}'
```

### Upload Document
```bash
curl -X POST http://localhost:8000/api/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@report.pdf" \
  -F "description=Supplier evaluation report"
```

### Health
```bash
curl http://localhost:8000/api/health
```

---

## Bonus AI Features (Architecture Ready)

- **Supplier Risk Classification** — Classify suppliers as low/medium/high risk based on delivery & quality scores
- **Price Forecasting** — Linear regression forecast from historical price data
- **Budget Recommendation** — Smart budget allocation advice based on remaining vs pending
- **Smart Buy Recommendation** — Composite scoring to recommend the best supplier

---

## License

MIT
