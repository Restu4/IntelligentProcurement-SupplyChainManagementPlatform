"""
Seed the knowledge base into ChromaDB from existing text files.

Usage: python seed_knowledge_base.py
"""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.database.chromadb import get_collection
from app.services.embedding_service import EmbeddingService
from app.services.chunk_service import ChunkService
from app.utils.logger import get_logger

logger = get_logger(__name__)

KNOWLEDGE_DIR = Path(__file__).parent.parent / "data"
FALLBACK_DIR = Path(__file__).parent / "knowledge_base"

ALLOWED_EXTENSIONS = {'.txt', '.md'}


def seed():
    embedder = EmbeddingService()
    chunk_service = ChunkService()
    collection = get_collection()

    source_dir = KNOWLEDGE_DIR if KNOWLEDGE_DIR.exists() else FALLBACK_DIR
    if not source_dir.exists():
        logger.error(f"No knowledge base directory found at {source_dir}")
        return

    files = []
    for ext in ['*.txt', '*.md']:
        files.extend(source_dir.glob(ext))

    if not files:
        logger.warning(f"No .txt or .md files found in {source_dir}")
        return

    total_chunks = 0

    for file_path in sorted(files):
        if file_path.suffix.lower() not in ALLOWED_EXTENSIONS:
            continue

        text = file_path.read_text(encoding="utf-8")
        if not text.strip():
            logger.warning(f"Skipping empty file: {file_path.name}")
            continue

        chunks = chunk_service.chunk_text(text)
        chunk_ids = []
        chunk_texts = []
        chunk_metadatas = []

        for idx, chunk_text in enumerate(chunks):
            chunk_id = f"seed_{file_path.stem}_{idx}"
            chunk_ids.append(chunk_id)
            chunk_texts.append(chunk_text)
            chunk_metadatas.append({
                "source": file_path.name,
                "filename": file_path.name,
                "file_type": file_path.suffix.lstrip('.'),
                "chunk_index": str(idx),
                "document_id": "seed",
            })

        if chunk_ids:
            # Explicit embeddings keep the index aligned with the query model,
            # and upsert makes re-seeding idempotent.
            embeddings = embedder.embed_batch(chunk_texts)
            collection.upsert(
                ids=chunk_ids,
                documents=chunk_texts,
                metadatas=chunk_metadatas,
                embeddings=embeddings,
            )
            total_chunks += len(chunks)
            logger.info(f"Seeded {file_path.name}: {len(chunks)} chunks")

    logger.info(f"Seeding complete. Total chunks: {total_chunks}")
    count = collection.count()
    logger.info(f"Total vectors in ChromaDB: {count}")


if __name__ == "__main__":
    seed()
