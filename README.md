<div align="center">

# SmartProcure AI

### Intelligent Procurement & Supply Chain Management Platform

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Flutter](https://img.shields.io/badge/Flutter-3-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE.txt)

<br>

An AI-powered procurement platform built with **Retrieval-Augmented Generation
(RAG)**. SmartProcure AI lets procurement teams query policies and supplier
documents in natural language, assess supplier risk, forecast prices, and track
budgets through a web dashboard, a mobile app, and a REST API.

</div>

---

## Project Status

| Module | Status | Notes |
|:-------|:-------|:------|
| Backend API | ✅ Working | Auth, chat (RAG), documents, suppliers, purchase orders, budgets, forecasts, health |
| Web dashboard | ✅ Builds and runs | `next build` passes; login, chat, suppliers, documents, POs and budgets wired to the API |
| Mobile app | 🟡 Implemented, needs SDK run | 5 tabs (Dashboard, Chat, Suppliers, Documents, Settings). Run `flutter analyze` locally |
| Purchase Orders | ✅ Working | Full CRUD + PRC-POG-002 approval matrix, status workflow, amendment re-approval |
| Budget module | ✅ Working | Full CRUD, per-year summary, utilization and remaining budget computed server-side |
| Analytics / Reports pages | 🔴 Demo data | Static charts, not connected to the API |
| Automated tests | ✅ Passing | 58 backend pytest tests (`backend/tests`) |
| CI / Docker | ✅ Added | GitHub Actions (pytest + `next build` + compose validation) and multi-stage Dockerfiles |

> The web app requires a running backend for live data. Analytics and reports
> pages still fall back to clearly labelled demo data.

---

## Key Highlights

### Web Dashboard (Next.js)
- **RAG-powered chat** — natural language Q&A with source citations and confidence scoring
- **Document intelligence** — upload PDF/DOCX/TXT/MD with text extraction, chunking, and embeddings
- **Supplier risk** — rule-based risk classification with delivery/quality scoring
- **Price forecasting** — linear regression forecasting plus smart-buy ranking
- **Purchase orders** — searchable, paginated PO list with approval levels derived
  from `data/02_PRC-POG-002_PO_Guidelines.md`, status workflow, and admin-only edits
- **Budget tracker** — live per-year department budgets with summary tiles,
  utilization bars, and create/edit/delete for administrators

### Mobile App (Flutter, Material 3 dark theme)
- **Dashboard** — live supplier/document counters and backend health
- **AI chat** — confidence badges, expandable sources, typing indicator
- **Suppliers** — client-side search and risk filters, risk assessment bottom sheet
- **Documents** — upload (admin only), list, and delete with confirmation
- **Settings** — profile, API endpoint, session and sign-out

### Backend API (FastAPI)
- **28 REST endpoints** — auth, chat, documents, suppliers, purchase orders, budgets, forecast, health
- **JWT auth** — PyJWT + bcrypt hashing and role-based access control (`admin` / `viewer`)
- **RAG pipeline** — Sentence Transformers + ChromaDB (cosine) + Gemini 2.0 Flash via `google-genai`
- **Honest degradation** — if Gemini is unavailable the API returns cited knowledge-base excerpts with `degraded: true` instead of an error string
- **9 database tables** — users, suppliers, budgets, documents, chunks, embeddings, chat history, forecasts, POs
- **Config safety** — fails fast in production on default secrets, wildcard CORS, or missing API keys

---

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌─────────────────────┐
│  Mobile App  │     │  Web App     │     │   REST API (FastAPI) │
│  (Flutter)   │────▶│  (Next.js)   │────▶│                     │
│  Material 3  │     │  TailwindCSS │     │  ┌───────────────┐  │
└──────────────┘     └──────────────┘     │  │  JWT Auth     │  │
                                          │  ├───────────────┤  │
                                          │  │  RAG Pipeline │  │
                                          │  │  ├─ Embedder  │  │
                                          │  │  ├─ ChromaDB  │  │
                                          │  │  └─ Gemini    │  │
                                          │  ├───────────────┤  │
                                          │  │  Forecasting  │  │
                                          │  └───────────────┘  │
                                          └─────────┬───────────┘
                                                    │
                                          ┌─────────▼───────────┐
                                          │  SQLite / PostgreSQL │
                                          │  (SQLAlchemy Async)  │
                                          └─────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|:------|:-----------|
| **Backend** | Python 3.12+, FastAPI, Uvicorn |
| **Database** | SQLite (dev) / PostgreSQL 16 (prod), SQLAlchemy Async, Alembic |
| **Vector Database** | ChromaDB |
| **Embeddings** | Sentence Transformers (`all-MiniLM-L6-v2`, 384-dim) |
| **LLM** | Google Gemini 2.0 Flash (`google-genai` SDK) |
| **Authentication** | JWT (PyJWT), bcrypt (passlib) |
| **File Processing** | PyMuPDF, pdfplumber, python-docx |
| **Forecasting** | scikit-learn, pandas, numpy |
| **Web Frontend** | Next.js 14, React 18, TypeScript, TailwindCSS, Recharts |
| **Mobile** | Flutter 3, Dart, Material 3, Provider, fl_chart |

---

## Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/                    # REST routers (auth, chat, documents, suppliers, purchase orders, budgets, forecast, health)
│   │   ├── services/               # RAG, LLM, chunking, parsing, forecasting, PO domain rules
│   │   ├── database/               # SQLAlchemy async engine + ChromaDB client
│   │   ├── models/                 # ORM models
│   │   ├── schemas/                # Pydantic schemas (incl. shared Page envelope)
│   │   ├── config/                 # Environment settings + runtime validation
│   │   └── utils/                  # Auth helpers (JWT, RBAC) and logging
│   ├── alembic/                    # Database migrations
│   ├── tests/                      # pytest suite (58 tests)
│   ├── main.py                     # App entry point (CORS, lifespan, routers)
│   ├── seed.py                     # Idempotent demo users, suppliers, budgets, POs
│   ├── seed_knowledge_base.py      # Chunk + embed data/ into ChromaDB
│   ├── requirements.txt            # Full runtime (ML stack)
│   ├── requirements-dev.txt        # Lightweight set for tests/CI
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── app/                    # App Router pages (10 modules)
│   │   ├── components/             # Reusable UI components
│   │   └── lib/                    # Typed API client, utils, constants
│   ├── .env.example                # NEXT_PUBLIC_API_URL
│   ├── Dockerfile
│   └── package.json
│
├── mobile/
│   ├── lib/
│   │   ├── config/                 # API base URL resolution
│   │   ├── models/                 # Data models
│   │   ├── providers/              # Auth, chat, suppliers, documents
│   │   ├── screens/                # Login, home, dashboard, chat, suppliers, docs, settings
│   │   ├── services/               # HTTP client
│   │   ├── theme/                  # Material 3 dark theme
│   │   ├── utils/                  # Formatters
│   │   ├── widgets/                # Shared widgets
│   │   └── main.dart
│   └── test/                       # Widget tests
│
├── data/                           # 25 sample procurement documents
├── docs/                           # PRD, architecture, ERD, API, testing, user manual
├── experiments/legacy_prototype/   # Superseded first spike (not part of the app)
├── .github/workflows/ci.yml        # Backend tests, frontend build, compose validation
├── docker-compose.yml              # Backend + frontend (+ optional PostgreSQL profile)
├── backend/.env.example
└── LICENSE.txt
```

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- Flutter 3.16+ (only for the mobile app)
- Google Gemini API key ([get one here](https://aistudio.google.com/apikey))

### 1. Backend

```bash
cd backend

python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

pip install -r requirements.txt

cp .env.example .env
# Generate a strong secret:
#   python -c "import secrets; print(secrets.token_urlsafe(48))"
# Then set JWT_SECRET_KEY and GEMINI_API_KEY in .env

python seed.py                  # demo users, suppliers, budgets, and POs (idempotent)
python seed_knowledge_base.py   # chunk + embed data/*.md into ChromaDB

python main.py
# API:  http://localhost:8000
# Docs: http://localhost:8000/docs
```

The seeder reads `../data` automatically; there is no need to copy files into
`backend/knowledge_base/`. Running `seed.py` more than once is safe — records are
matched by natural keys instead of being inserted twice.

To run only the API and the test suite without the ML stack, install the
lightweight set instead:

```bash
pip install -r requirements-dev.txt
```

### 2. Web frontend

```bash
cd frontend
npm install
cp .env.example .env.local      # set NEXT_PUBLIC_API_URL if the API is remote
npm run dev
# Web app: http://localhost:3000
```

Production build check:

```bash
npm run build
```

### 3. Mobile app

```bash
cd mobile
flutter pub get
flutter analyze
flutter test

# Android emulator (10.0.2.2 points to the host machine)
flutter run

# Physical device: use your machine's LAN IP
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:8000
```

For Flutter web, generate the web runner once, then run:

```bash
flutter create --platforms=web .
flutter run -d chrome --dart-define=API_BASE_URL=http://localhost:8000
```

### 4. Docker

The whole stack can run in containers:

```bash
cp backend/.env.example .env      # then edit JWT_SECRET_KEY and GEMINI_API_KEY
docker compose up --build

# Web app:  http://localhost:3000
# API:      http://localhost:8000/docs
```

For a production-like database, start the optional PostgreSQL profile and point
the backend at it:

```bash
docker compose --profile postgres up --build
# DATABASE_URL=postgresql+asyncpg://smartprocure:smartprocure@db:5432/smartprocure
```

The backend entrypoint fixes ownership of the mounted `/data` volume and then
drops privileges to the unprivileged `appuser`. The frontend image uses Next.js
`output: "standalone"`.

---

## Testing & CI

```bash
cd backend
pip install -r requirements-dev.txt
python -m pytest            # 58 tests
```

The suite uses a temporary SQLite database, stubs the embedding model and
ChromaDB, and covers auth/RBAC, suppliers, purchase orders (approval matrix and
workflow), budgets, chat degradation, forecasts, document upload/delete, and
configuration validation.

GitHub Actions (`.github/workflows/ci.yml`) runs on every push/PR:

1. backend byte-compile + pytest,
2. `npm ci && npm run build` for the frontend,
3. `docker compose config -q` to validate the compose file.

The full backend image installs torch/sentence-transformers and therefore takes
several minutes to build; build it manually before a release.

---

## Demo Credentials

| Role | Username | Email | Password | Access |
|:-----|:---------|:------|:---------|:-------|
| **Admin** | `admin` | `admin@smartprocure.ai` | `admin123` | Full access, including uploads and supplier creation |
| **Viewer** | `viewer` | `viewer@smartprocure.ai` | `viewer123` | Read-only: dashboard, chat, supplier list, documents |

Public registration always creates a **viewer** account. An administrator must
promote a user to `admin` directly in the database.

---

## API Reference

**Pagination:** list endpoints accept `limit` (1–200) and `offset` (≥0).
`/api/purchase-orders` and `/api/budgets` return a `Page` envelope
(`{ items, total, limit, offset }`); the other list endpoints return a plain
array without a total count.

| Method | Endpoint | Auth | Description |
|:-------|:---------|:-----|:------------|
| `POST` | `/api/login` | Public | Authenticate and receive a JWT |
| `POST` | `/api/register` | Public | Register a viewer account |
| `GET` | `/api/me` | User | Current user profile |
| `POST` | `/api/chat` | User | Ask the RAG engine a question |
| `GET` | `/api/history` | User | Conversation history (`limit`, `offset`) |
| `POST` | `/api/upload` | **Admin** | Upload and index a document |
| `GET` | `/api/documents` | User | List indexed documents (`limit`, `offset`) |
| `GET` | `/api/documents/{id}` | User | Document detail |
| `DELETE` | `/api/documents/{id}` | **Admin** | Delete a document and its vectors |
| `GET` | `/api/suppliers` | User | List suppliers (`status`, `risk_level`, `category`, `q`, `limit`, `offset`) |
| `GET` | `/api/suppliers/{id}` | User | Supplier detail |
| `POST` | `/api/suppliers` | **Admin** | Create a supplier |
| `GET` | `/api/suppliers/{id}/risk` | User | Rule-based risk assessment |
| `GET` | `/api/purchase-orders` | User | Paginated POs (`status`, `supplier_id`, `q`, `limit`, `offset`) |
| `GET` | `/api/purchase-orders/{id}` | User | PO detail |
| `POST` | `/api/purchase-orders` | **Admin** | Create a PO (auto PO number + approval level) |
| `PATCH` | `/api/purchase-orders/{id}` | **Admin** | Update fields or advance the workflow |
| `DELETE` | `/api/purchase-orders/{id}` | **Admin** | Delete a draft/pending/rejected PO |
| `GET` | `/api/budgets` | User | Paginated budgets (`fiscal_year`, `department`, `limit`, `offset`) |
| `GET` | `/api/budgets/summary` | User | Aggregate totals for a fiscal year |
| `GET` | `/api/budgets/{id}` | User | Budget detail |
| `POST` | `/api/budgets` | **Admin** | Create a department budget |
| `PATCH` | `/api/budgets/{id}` | **Admin** | Update a budget |
| `DELETE` | `/api/budgets/{id}` | **Admin** | Delete a budget |
| `POST` | `/api/forecast` | User | Price, risk, budget, or demand forecast |
| `GET` | `/api/forecast` | User | Forecast history (`limit`, `offset`, `supplier_id`) |
| `GET` | `/api/forecast/smart-buy` | User | Ranked purchase recommendation |
| `GET` | `/api/health` | Public | Database, ChromaDB, and Gemini status |

### Purchase-order approval matrix

Derived from `data/02_PRC-POG-002_PO_Guidelines.md`; the backend assigns the
level automatically from the amount:

| Amount (IDR) | Approval level |
|:-------------|:---------------|
| ≤ 25,000,000 | Procurement Manager |
| ≤ 150,000,000 | Senior Procurement Manager |
| ≤ 750,000,000 | Procurement Director |
| > 750,000,000 | CFO + Procurement Director |

Status transitions: `draft → pending → approved → completed`; `cancelled` is
available from `draft`, `pending`, or `approved`, and `rejected` can be reopened
as `draft`. A PO cannot be created directly as `approved` or `completed`, and an
amount change of more than 10% on an approved/completed PO resets it to `pending`
for re-approval.

---

## RAG Pipeline

```
User question
    │
    ▼
Sentence Transformers embedding (384-dim)
    │
    ▼
ChromaDB cosine search (top-k = 5)
    │
    ▼
Best-match score ≥ 70%?
    ┌──────┴──────┐
   YES           NO
    ▼             ▼
Gemini 2.0     "Information not found
Flash +        in the knowledge base"
sources
```

Notes:
- Chunks are stored with explicit embeddings from the same model used at query
  time, so the vector space is consistent.
- The confidence gate uses the strongest retrieved chunk; averaging all top-k
  neighbours systematically under-reports confidence.
- Blocking work (embedding, Chroma queries, file parsing, bcrypt, sklearn) runs
  in worker threads so the event loop stays responsive.
- If Gemini is not configured or fails, the API returns the top knowledge-base
  excerpts with `"degraded": true` rather than a fabricated answer.

---

## Known Limitations

- Analytics and reports pages still render demo data (PO, budget, supplier,
  document and chat views are live).
- Supplier risk and smart-buy scoring are rule-based, not learned models.
- The embedding model is English-centric; Indonesian queries may retrieve less
  accurately. A multilingual model is on the roadmap.
- No rate limiting, refresh tokens, or audit log yet.
- Flutter code has not been run through `flutter analyze`/`flutter test` in this
  environment (no Flutter SDK); imports were checked manually.
- The Docker backend image installs the full ML stack and is built on demand,
  not in CI.

---

## Documentation

- **[PRD](docs/PRD.md)** — Product Requirements Document
- **[System Architecture](docs/System_Architecture.md)** — Architecture and design decisions
- **[API Documentation](docs/API_Documentation.md)** — Full REST API reference
- **[ERD](docs/ERD.md)** — Database entity relationship diagram
- **[Flowcharts](docs/Flowchart.md)** — Business process flows
- **[Installation Guide](docs/Installation_Guide.md)** — Detailed setup instructions
- **[Deployment Guide](docs/Deployment_Guide.md)** — Production deployment
- **[Testing Plan](docs/Testing_Plan.md)** — QA strategy and test cases
- **[AI Evaluation](docs/AI_Evaluation_Report.md)** — RAG performance analysis
- **[User Manual](docs/User_Manual.md)** — End-user documentation

---

## License

MIT — see [LICENSE.txt](LICENSE.txt).

---

<div align="center">

**SmartProcure AI** — Artificial Intelligence Final Project

Universitas Cakrawala

</div>
