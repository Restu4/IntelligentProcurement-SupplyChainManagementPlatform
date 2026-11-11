# Legacy prototype (superseded)

These files are the very first spike of the project and are **not part of the
application**. They are kept only for history.

| File | What it was | Why it is obsolete |
| --- | --- | --- |
| `app.py` | Flask page that called `rag.ask()` | Flask is not a project dependency and `templates/index.html` was never committed |
| `rag.py` | Keyword matcher (`if "sla" in question`) returning whole documents | Not retrieval-augmented; replaced by `backend/app/services/rag_service.py` |
| `build_db.py` | Embedded whole `.md` files into ChromaDB as single vectors | Replaced by `backend/seed_knowledge_base.py` (chunking + metadata) |
| `test_import.py`, `test_model.py`, `test_vector.py`, `test.py` | Print-based smoke scripts | Not assertions; replaced by the pytest suite |

Do not run these against the production database or vector store.
