from typing import List

from app.config.settings import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

_model = None


def get_embedding_model():
    """Load Sentence Transformers lazily.

    Importing the library (and downloading weights) at module import time made
    every process start slow and required the ML stack just to run the API.
    """
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer

        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL_NAME}")
        _model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        logger.info("Embedding model loaded")
    return _model


class EmbeddingService:

    @staticmethod
    def embed(text: str) -> List[float]:
        model = get_embedding_model()
        return model.encode(text, normalize_embeddings=True).tolist()

    @staticmethod
    def embed_batch(texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        model = get_embedding_model()
        return model.encode(texts, normalize_embeddings=True).tolist()

    @staticmethod
    def get_dimension() -> int:
        model = get_embedding_model()
        return model.get_sentence_embedding_dimension()
