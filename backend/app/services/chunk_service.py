from typing import List
from app.utils.logger import get_logger

logger = get_logger(__name__)


class ChunkService:

    DEFAULT_CHUNK_SIZE = 500
    DEFAULT_OVERLAP = 100

    @staticmethod
    def chunk_text(
        text: str,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        overlap: int = DEFAULT_OVERLAP,
    ) -> List[str]:
        if not text or not text.strip():
            return []

        text = text.strip()
        chunks = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = min(start + chunk_size, text_len)

            if end < text_len:
                last_period = text.rfind(".", start, end)
                last_newline = text.rfind("\n", start, end)
                break_point = max(last_period, last_newline)
                if break_point > start + chunk_size // 2:
                    end = break_point + 1

            chunk = text[start:end].strip()
            if chunk:
                chunks.append(chunk)

            start = end - overlap if end < text_len else text_len

        logger.info(f"Split {text_len} chars into {len(chunks)} chunks")
        return chunks

    @staticmethod
    def estimate_tokens(text: str) -> int:
        return len(text) // 4
