import chromadb
from chromadb.config import Settings as ChromaSettings
from app.config.settings import settings

_chroma_client = None


def get_chroma_client():
    global _chroma_client
    if _chroma_client is None:
        _chroma_client = chromadb.PersistentClient(
            path=settings.CHROMA_PERSIST_DIR,
            settings=ChromaSettings(
                anonymized_telemetry=False,
                allow_reset=True,
            ),
        )
    return _chroma_client


def get_collection(collection_name: str = "smartprocure"):
    client = get_chroma_client()
    return client.get_or_create_collection(
        name=collection_name,
        metadata={"hnsw:space": "cosine"},
    )


def reset_collection(collection_name: str = "smartprocure"):
    client = get_chroma_client()
    try:
        client.delete_collection(collection_name)
    except ValueError:
        pass
    return get_collection(collection_name)
