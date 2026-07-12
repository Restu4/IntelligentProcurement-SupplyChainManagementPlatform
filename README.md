<div align="center">

# SmartProcure AI

### Intelligent Procurement & Supply Chain Management Platform

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)
[![Flutter](https://img.sh.shields.io/badge/Flutter-3-02569B?style=for-the-badge&logo=flutter&logoColor=white)](https://flutter.dev)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE.txt)

<br>

An enterprise-grade AI-powered procurement platform built with **Retrieval-Augmented Generation (RAG)** technology. SmartProcure AI enables procurement professionals to query documents using natural language, assess supplier risk, forecast prices, and manage budgets — all through a unified web and mobile experience.

</div>

---

## Key Highlights

### Web Dashboard (Next.js)
- **RAG-Powered Chat** — Natural language Q&A over procurement documents with source citations and confidence scoring
- **Document Intelligence** — Upload PDF/DOCX/TXT with automatic text extraction, chunking, and vector embedding
- **Supplier Risk Management** — AI-driven risk classification with performance scoring and real-time monitoring
- **Price Forecasting** — Linear regression-based price prediction with smart buy recommendations
- **Budget Tracking** — Department-wise allocation monitoring with utilization dashboards and bar charts
- **Purchase Orders** — Create, track, and manage POs with status workflow

### Mobile App (Flutter)
- **Cross-Platform** — Runs on Android, iOS, and Web (Chrome)
- **Dark Theme UI** — Material 3 design with teal/blue accent palette
- **AI Chat** — Confidence badges (green/yellow/red), expandable source citations, typing indicators
- **Supplier Search & Filter** — Real-time search, status/risk filter dropdowns, summary cards
- **Global Search** — Search across suppliers, POs, documents, forecasts from the dashboard
- **Push-Style Notifications** — Clickable notification items that navigate to relevant pages

### Backend API (FastAPI)
- **15 REST Endpoints** — Auth, Chat, Documents, Suppliers, Forecast, Health
- **JWT Authentication** — Secure token-based auth with bcrypt password hashing
- **RAG Pipeline** — Sentence Transformers embeddings + ChromaDB vector search + Gemini LLM
- **9 Database Tables** — Users, Suppliers, Budgets, Documents, Chat History, Forecasts, POs

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
                                          │   SQLite / PostgreSQL│
                                          │   (SQLAlchemy Async) │
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
| **LLM** | Google Gemini 2.0 Flash |
| **Authentication** | JWT (python-jose), bcrypt (passlib) |
| **File Processing** | PyMuPDF, pdfplumber, python-docx |
| **Forecasting** | scikit-learn, pandas, numpy |
| **Web Frontend** | Next.js 14, React 18, TypeScript, TailwindCSS, Recharts |
| **Mobile** | Flutter 3, Dart, Material 3, fl_chart, Provider |

---

## Project Structure

```
├── backend/                        # FastAPI Backend
│   ├── app/
│   │   ├── api/                    # REST endpoint routers
│   │   ├── services/               # Business logic (RAG, LLM, Forecast)
│   │   ├── database/               # SQLAlchemy async engine
│   │   ├── models/                 # ORM models (User, Supplier, Budget, etc.)
│   │   ├── schemas/                # Pydantic request/response schemas
│   │   ├── config/                 # Environment-based settings
│   │   └── utils/                  # Auth, logging utilities
│   ├── alembic/                    # Database migration scripts
│   ├── knowledge_base/             # RAG source documents
│   ├── main.py                     # Application entry point
│   ├── seed.py                     # Database seeder
│   ├── seed_knowledge_base.py      # Vector DB seeder
│   └── requirements.txt            # Python dependencies
│
├── frontend/                       # Next.js Web Application
│   ├── src/
│   │   ├── app/                    # App Router pages (10 modules)
│   │   ├── components/             # Reusable UI components
│   │   └── lib/                    # API client, utilities
│   ├── tailwind.config.ts
│   └── package.json
│
├── mobile/                         # Flutter Mobile Application
│   ├── lib/
│   │   ├── screens/                # 10 screens (Dashboard, Chat, Upload, etc.)
│   │   ├── providers/              # State management (Provider pattern)
│   │   ├── services/               # API service layer
│   │   ├── theme/                  # Dark theme configuration
│   │   └── models/                 # Data models
│   └── pubspec.yaml
│
├── data/                           # Sample procurement documents
├── docs/                           # Technical documentation
│   ├── PRD.md                      # Product Requirements Document
│   ├── System_Architecture.md      # Architecture & design decisions
│   ├── API_Documentation.md        # Full API reference
│   ├── ERD.md                      # Entity Relationship Diagram
│   ├── Flowchart.md                # Process flow diagrams
│   ├── Deployment_Guide.md         # Production deployment steps
│   ├── Installation_Guide.md       # Local development setup
│   ├── Testing_Plan.md             # QA strategy & test cases
│   ├── AI_Evaluation_Report.md     # RAG performance analysis
│   └── User_Manual.md              # End-user guide
│
├── .env.example                    # Environment variable template
├── LICENSE.txt                     # MIT License
└── README.md                       # This file
```

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 20+
- Flutter 3.12+
- Google Gemini API Key ([Get one here](https://aistudio.google.com/apikey))

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set your GEMINI_API_KEY and JWT_SECRET_KEY

# Seed database with demo data
python seed.py

# Seed knowledge base (RAG documents)
cp ../data/*.txt knowledge_base/
python seed_knowledge_base.py

# Start server
python main.py
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Web App: http://localhost:3000
```

### 3. Mobile Setup

```bash
cd mobile
flutter pub get
flutter run -d chrome            # Run on Chrome (web)
flutter run                      # Run on connected device/emulator
```

### Demo Credentials

| Role | Username | Email | Password | Access Level |
|:-----|:---------|:------|:---------|:-------------|
| **Admin** | `admin` | `admin@smartprocure.ai` | `admin123` | Full access — Dashboard, Chat, Upload, Suppliers, Budget, Forecast, Settings |
| **Viewer** | `viewer` | `viewer@smartprocure.ai` | `viewer123` | Read-only — Dashboard view, Chat, Supplier list |

> Both accounts work on **Web Dashboard** (`http://localhost:3000`), **Mobile App** (Flutter), and **API** (`http://localhost:8000/docs`).

### Demo Accounts Overview

| Account | Web Dashboard Features | Mobile Features |
|:--------|:----------------------|:----------------|
| **Admin** | Full dashboard analytics, AI chat with RAG, document upload & management, supplier risk assessment, budget tracker, price forecast, purchase orders, settings & profile management | Dashboard, AI Chat, Upload documents, Supplier risk list with search/filter, Budget overview, Settings with notification toggles |
| **Viewer** | View dashboard analytics, AI chat queries, browse suppliers, view budget overview | Dashboard, AI Chat, Supplier list |

---

## API Reference

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/api/login` | Authenticate and receive JWT token |
| `POST` | `/api/register` | Register a new user account |
| `GET` | `/api/me` | Retrieve current user profile |
| `POST` | `/api/chat` | Send a question to the RAG engine |
| `GET` | `/api/history` | Fetch conversation history |
| `POST` | `/api/upload` | Upload a procurement document |
| `GET` | `/api/documents` | List all indexed documents |
| `DELETE` | `/api/documents/{id}` | Remove a document from the system |
| `GET` | `/api/suppliers` | List all suppliers with risk data |
| `POST` | `/api/suppliers` | Register a new supplier |
| `GET` | `/api/suppliers/{id}/risk` | Get AI risk assessment for a supplier |
| `POST` | `/api/forecast` | Generate a price forecast |
| `GET` | `/api/forecast` | Retrieve forecast history |
| `GET` | `/api/forecast/smart-buy` | Get AI-ranked purchase recommendations |
| `GET` | `/api/health` | System health check |

---

## RAG Pipeline

```
User Question
    │
    ▼
┌─────────────────┐
│  Text Embedding  │  Sentence Transformers (384-dim)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  ChromaDB Query  │  Cosine similarity, Top-K retrieval
└────────┬────────┘
         │
         ▼
    Confidence ≥ 70%?
    ┌──────┴──────┐
    │ YES         │ NO
    ▼             ▼
┌─────────┐  ┌──────────────────┐
│ Gemini  │  │ Fallback Response │
│ LLM →   │  │ "Information not  │
│ Answer  │  │  found in docs"   │
│ +Sources│  └──────────────────┘
└─────────┘
```

---

## Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

- **[PRD](docs/PRD.md)** — Product Requirements Document
- **[System Architecture](docs/System_Architecture.md)** — Architecture & design decisions
- **[API Documentation](docs/API_Documentation.md)** — Full REST API reference
- **[ERD](docs/ERD.md)** — Database entity relationship diagram
- **[Flowcharts](docs/Flowchart.md)** — Business process flows
- **[Installation Guide](docs/Installation_Guide.md)** — Detailed setup instructions
- **[Deployment Guide](docs/Deployment_Guide.md)** — Production deployment
- **[Testing Plan](docs/Testing_Plan.md)** — QA strategy and test cases
- **[AI Evaluation](docs/AI_Evaluation_Report.md)** — RAG performance benchmarks
- **[User Manual](docs/User_Manual.md)** — End-user documentation

---

## License

This project is licensed under the MIT License. See [LICENSE.txt](LICENSE.txt) for details.

---

<div align="center">

**SmartProcure AI** — Built for the Artificial Intelligence Final Project

Universitas Cakrawala

</div>
