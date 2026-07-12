from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List

from app.config.settings import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

_model = None


def get_embedding_model() -> SentenceTransformer:
    global _model
    if _model is None:
        logger.info(f"Loading embedding model: {settings.EMBEDDING_MODEL_NAME}")
        _model = SentenceTransformer(settings.EMBEDDING_MODEL_NAME)
        logger.info("Embedding model loaded")
    return _model


class EmbeddingService:

    @staticmethod
    def embed(text: str) -> List[float]:
        model = get_embedding_model()
        embedding = model.encode(text).tolist()
        return embedding

    @staticmethod
    def embed_batch(texts: List[str]) -> List[List[float]]:
        model = get_embedding_model()
        embeddings = model.encode(texts).tolist()
        return embeddings

    @staticmethod
    def get_dimension() -> int:
        model = get_embedding_model()
        return model.get_sentence_embedding_dimension()
