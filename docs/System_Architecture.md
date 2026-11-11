# System Architecture
## SmartProcure AI — Enterprise Architecture Document

---

## 1. Architecture Overview

SmartProcure AI follows a **modern microservices-oriented architecture** with clear separation of concerns. The system is composed of four main layers: **Presentation Layer**, **API Gateway Layer**, **Service Layer**, and **Data Layer**.

```
┌─────────────────────────────────────────────────────────────┐
│                   PRESENTATION LAYER                        │
│  ┌──────────────────┐  ┌──────────────────────────────────┐ │
│  │  Next.js Web App  │  │     Flutter Mobile App           │ │
│  │  (Tailwind/Shadcn)│  │     (Material 3)                 │ │
│  └────────┬─────────┘  └──────────────┬───────────────────┘ │
└───────────┼────────────────────────────┼─────────────────────┘
            │           HTTPS            │
┌───────────┼────────────────────────────┼─────────────────────┐
│           ▼                            ▼                     │
│  ┌──────────────────────────────────────────────────────────┐│
│  │                 API GATEWAY (FastAPI)                    ││
│  │  ┌─────────┐ ┌──────────┐ ┌────────┐ ┌──────────────┐  ││
│  │  │ Auth    │ │ Chat/RAG │ │Upload  │ │ Forecast     │  ││
│  │  │ Router  │ │ Router   │ │ Router │ │ Router       │  ││
│  │  └────┬────┘ └────┬─────┘ └───┬────┘ └──────┬───────┘  ││
│  └───────┼───────────┼───────────┼─────────────┼───────────┘│
└───────────┼───────────┼───────────┼─────────────┼───────────┘
            │           │           │             │
┌───────────┼───────────┼───────────┼─────────────┼───────────┐
│           ▼           ▼           ▼             ▼           │
│  ┌──────────────────────────────────────────────────────────┐│
│  │                   SERVICE LAYER                          ││
│  │  ┌──────────┐ ┌───────┐ ┌────────┐ ┌───────────────┐   ││
│  │  │ RAG      │ │LLM    │ │Embedder│ │ Parser        │   ││
│  │  │ Service  │ │Service│ │Service │ │ Service       │   ││
│  │  └────┬─────┘ └───┬───┘ └───┬────┘ └───────┬───────┘   ││
│  │  ┌────┴─────┐ ┌───┴────┐ ┌──┴─────┐ ┌──────┴───────┐  ││
│  │  │ Chunk    │ │Forecast│ │Smart   │ │ Auth         │  ││
│  │  │ Service  │ │Service │ │Buy     │ │ Utils        │  ││
│  │  └──────────┘ └────────┘ └────────┘ └──────────────┘  ││
│  └──────────────────────────────────────────────────────────┘│
└───────────┬───────────┬───────────┬──────────────────────────┘
            │           │           │
┌───────────┼───────────┼───────────┼──────────────────────────┐
│           ▼           ▼           ▼                          │
│  ┌─────────────┐ ┌─────────┐ ┌──────────────────────────┐   │
│  │  PostgreSQL  │ │ChromaDB │ │  File System (Uploads)   │   │
│  │  (Relational)│ │(Vector) │ │                          │   │
│  └─────────────┘ └─────────┘ └──────────────────────────┘   │
│                   DATA LAYER                                  │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Technology Stack Details

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14, React 18, TailwindCSS | Web dashboard |
| Mobile | Flutter 3, Material 3 | Mobile app |
| Backend | FastAPI, Python 3.12 | REST API server |
| Database | PostgreSQL 16 | Relational data |
| Vector DB | ChromaDB | Vector embeddings |
| Embeddings | Sentence Transformers (`paraphrase-multilingual-MiniLM-L12-v2`) | Text embeddings |
| LLM | Google Gemini 2.0 Flash | Answer generation |
| Auth | JWT (PyJWT) + bcrypt, rotating refresh tokens | Authentication and sessions |
| File Parsing | PyMuPDF, pdfplumber, python-docx | Document extraction |
| Forecasting | scikit-learn (Linear Regression) | Price prediction |

---

## 3. Data Flow — RAG Pipeline

```
User Question
    │
    ▼
1. Embedding Generation
   ├─ SentenceTransformer.encode(question)
   └─ Returns 384-dim vector
    │
    ▼
2. Vector Search (ChromaDB)
   ├─ Query: cosine similarity
   ├─ Results: Top 5 chunks
   └─ Returns: documents + metadata + distances
    │
    ▼
3. Distance → Confidence Score
   ├─ avg_score = 1 - avg(distance)
   └─ confidence = avg_score * 100
    │
    ▼
4. Confidence Check
   ├─ ≥ 70% → Continue to LLM
   └─ < 70% → Return "Info not found"
    │
    ▼
5. LLM Prompt Construction
   ├─ Context: retrieved chunks with source labels
   ├─ Question: user's original question
   └─ Instruction: answer based only on context
    │
    ▼
6. Gemini API Call
   ├─ Model: gemini-2.0-flash
   └─ Parameters: temperature=0.3, max_tokens=1024
    │
    ▼
7. Response Assembly
   ├─ answer: LLM response
   ├─ sources: list of {document, chunk, score}
   └─ confidence: confidence score
```

---

## 4. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Async SQLAlchemy** | Non-blocking database operations for concurrent requests |
| **ChromaDB over Pinecone** | Local deployment, no API costs, open source |
| **Sentence Transformers** | Local embedding generation, no API dependency |
| **Google Gemini** | Cost-effective, strong performance for RAG tasks |
| **JWT Auth** | Stateless authentication, scalable |
| **Cosine Similarity** | Best for semantic search in high-dimensional space |
