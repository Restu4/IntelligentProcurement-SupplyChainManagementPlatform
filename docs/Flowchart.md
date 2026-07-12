# System Flowchart
## SmartProcure AI — Process Flow Diagrams

---

## 1. User Authentication Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  User     │     │  Frontend    │     │  Backend API  │
│  Browser  │     │  (Next.js)   │     │  (FastAPI)    │
└─────┬────┘     └──────┬───────┘     └──────┬───────┘
      │                 │                    │
      │  1. Login Form  │                    │
      │────────────────►│                    │
      │                 │                    │
      │                 │  2. POST /login    │
      │                 │───────────────────►│
      │                 │                    │
      │                 │                    │  3. Verify credentials
      │                 │                    │     (bcrypt compare)
      │                 │                    │
      │                 │                    │  4. Generate JWT
      │                 │                    │
      │                 │  5. Return Token   │
      │                 │◄───────────────────│
      │                 │                    │
      │  6. Store Token  │                    │
      │◄────────────────│                    │
      │                 │                    │
      │  7. Redirect to  │                    │
      │     Dashboard    │                    │
      │────────────────►│                    │
```

---

## 2. RAG Pipeline Flow

```
┌──────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User     │     │ Embedding │     │ ChromaDB │     │  Gemini  │     │  User    │
│  Question │     │  Service  │     │  Search  │     │   LLM    │     │  Sees    │
└─────┬────┘     └─────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
      │                │                 │                 │                │
      │  1. Question   │                 │                 │                │
      │───────────────►│                 │                 │                │
      │                │                 │                 │                │
      │                │  2. Generate    │                 │                │
      │                │     Embedding   │                 │                │
      │                │     (384-dim)   │                 │                │
      │                │                 │                 │                │
      │                │  3. Query Vector│                 │                │
      │                │────────────────►│                 │                │
      │                │                 │                 │                │
      │                │                 │  4. Cosine      │                │
      │                │                 │     Similarity  │                │
      │                │                 │     Top-5       │                │
      │                │                 │                 │                │
      │                │  5. Chunks +    │                 │                │
      │                │     Scores      │                 │                │
      │                │◄────────────────│                 │                │
      │                │                 │                 │                │
      │                │  6. Confidence  │                 │                │
      │                │     ≥ 70%?      │                 │                │
      │                │     │           │                 │                │
      │                │     ├─ No → Return "not found"   │                │
      │                │     │                              │                │
      │                │     └─ Yes → Build RAG prompt     │                │
      │                │                 │                 │                │
      │                │  7. RAG Prompt  │                 │                │
      │                │─────────────────────────────────►│                │
      │                │                 │                 │                │
      │                │                 │                 │  8. Generate   │
      │                │                 │                 │     Answer     │
      │                │                 │                 │                │
      │                │  9. Final Answer│                 │                │
      │                │◄──────────────────────────────────│                │
      │                │                 │                 │                │
      │  10. Display   │                 │                 │                │
      │◄───────────────│                 │                 │                │
      │                │                 │                 │                │
```

---

## 3. Document Upload & Processing Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐     ┌──────────┐
│  User     │     │  Parser      │     │  Chunk       │     │ Embedder │     │ ChromaDB │
│  Uploads  │     │  Service     │     │  Service     │     │ Service  │     │          │
└─────┬────┘     └──────┬───────┘     └──────┬───────┘     └────┬─────┘     └────┬─────┘
      │                 │                    │                  │                │
      │  1. File (PDF/  │                    │                  │                │
      │     DOCX/TXT)   │                    │                  │                │
      │────────────────►│                    │                  │                │
      │                 │                    │                  │                │
      │                 │  2. Extract Text   │                  │                │
      │                 │     (pdfplumber/   │                  │                │
      │                 │      python-docx)  │                  │                │
      │                 │                    │                  │                │
      │                 │  3. Raw Text       │                  │                │
      │                 │───────────────────►│                  │                │
      │                 │                    │                  │                │
      │                 │                    │  4. Split into   │                │
      │                 │                    │     Chunks       │                │
      │                 │                    │     (500/100)    │                │
      │                 │                    │                  │                │
      │                 │                    │  5. Chunks       │                │
      │                 │                    │─────────────────►│                │
      │                 │                    │                  │                │
      │                 │                    │                  │  6. Generate   │
      │                 │                    │                  │     Embeddings │
      │                 │                    │                  │                │
      │                 │                    │                  │  7. Store Vectors│
      │                 │                    │                  │───────────────►│
      │                 │                    │                  │                │
      │  8. Success     │                    │                  │                │
      │◄────────────────│────────────────────│──────────────────│                │
      │                 │                    │                  │                │
```

---

## 4. Forecast & Smart Buy Flow

```
┌──────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│  User     │     │  Forecast    │     │  scikit-learn │     │Database │
│  Request  │     │  Service     │     │  / Logic     │     │         │
└─────┬────┘     └──────┬───────┘     └──────┬───────┘     └────┬─────┘
      │                 │                    │                  │
      │  Price Forecast │                    │                  │
      │────────────────►│                    │                  │
      │                 │                    │                  │
      │                 │  Historical Prices │                  │
      │                 │───────────────────►│                  │
      │                 │                    │                  │
      │                 │                    │  Linear          │
      │                 │                    │  Regression      │
      │                 │                    │                  │
      │                 │  Predicted Values  │                  │
      │                 │◄───────────────────│                  │
      │                 │                    │                  │
      │  Result + CI    │                    │                  │
      │◄────────────────│                    │                  │
      │                 │                    │                  │
      │  Risk Classify  │                    │                  │
      │────────────────►│                    │                  │
      │                 │  Supplier Scores   │                  │
      │                 │───────────────────►│                  │
      │                 │                    │                  │
      │                 │                    │  Risk Formula    │
      │                 │                    │  (Delivery +     │
      │                 │                    │   Quality + Late)│
      │                 │                    │                  │
      │                 │  Risk Level        │                  │
      │                 │◄───────────────────│                  │
      │  Risk Result    │                    │                  │
      │◄────────────────│                    │                  │
      │                 │                    │                  │
      │  Smart Buy      │                    │                  │
      │────────────────►│                    │                  │
      │                 │  Get all suppliers │                  │
      │                 │─────────────────────────────────────►│
      │                 │                    │                  │
      │                 │◄─────────────────────────────────────│
      │                 │                    │                  │
      │                 │  Composite Score   │                  │
      │                 │  (40% Delivery +   │                  │
      │                 │   40% Quality +    │                  │
      │                 │   20% Price)       │                  │
      │                 │                    │                  │
      │  Recommendation │                    │                  │
      │◄────────────────│                    │                  │
```

---

## 5. Database Migration Flow

```
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌──────────────┐
│  Developer │     │ Alembic  │     │  Migration   │     │  PostgreSQL  │
│  (Code)   │     │ Config   │     │  Script      │     │  Database    │
└─────┬────┘     └────┬─────┘     └──────┬───────┘     └──────┬───────┘
      │               │                  │                    │
      │  1. Change    │                  │                    │
      │     Models    │                  │                    │
      │               │                  │                    │
      │  2. Generate  │                  │                    │
      │──────────────►│                  │                    │
      │               │                  │                    │
      │               │  3. Create       │                    │
      │               │     Migration    │                    │
      │               │─────────────────►│                    │
      │               │                  │                    │
      │               │                  │  4. Apply Upgrade  │
      │               │                  │───────────────────►│
      │               │                  │                    │
      │               │                  │                    │  5. Execute
      │               │                  │                    │     SQL
      │               │                  │                    │
      │               │                  │  6. Success        │
      │               │                  │◄───────────────────│
      │               │                  │                    │
      │  7. Confirmed │                  │                    │
      │◄──────────────│──────────────────│                    │
```
