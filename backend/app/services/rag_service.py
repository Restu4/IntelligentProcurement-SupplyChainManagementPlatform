import asyncio

from app.config.settings import settings
from app.database.chromadb import get_collection
from app.services.embedding_service import EmbeddingService
from app.services.llm_service import LLMError, LLMService, LLMUnavailableError
from app.utils.logger import get_logger

logger = get_logger(__name__)


class RagService:

    def __init__(self):
        self._collection = None
        self.embedder = EmbeddingService()
        self.llm = LLMService()

    @property
    def collection(self):
        if self._collection is None:
            self._collection = get_collection()
        return self._collection

    @staticmethod
    def _excerpts(chunks: list[str], sources: list[str], limit: int = 3, width: int = 400) -> str:
        lines = []
        for chunk, source in zip(chunks[:limit], sources[:limit]):
            lines.append(f"**{source}**\n> {chunk[:width].strip()}")
        return "\n\n".join(lines)

    async def answer(self, question: str) -> dict:
        question = question.strip()
        top_k = settings.RAG_TOP_K
        threshold = settings.CONFIDENCE_THRESHOLD

        # Embedding and Chroma are CPU-bound/blocking; keep the event loop free.
        query_embedding = await asyncio.to_thread(self.embedder.embed, question)
        results = await asyncio.to_thread(
            self.collection.query,
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )

        retrieved_chunks: list[str] = []
        retrieved_sources: list[str] = []
        retrieved_scores: list[float] = []

        if results["documents"] and results["documents"][0]:
            distances = results["distances"][0] if results["distances"] else []
            for idx, doc_text in enumerate(results["documents"][0]):
                distance = distances[idx] if idx < len(distances) else 1.0
                # Chroma cosine distance is in [0, 2]; similarity is in [-1, 1].
                score = max(0.0, min(1.0, 1.0 - distance))
                metadata = results["metadatas"][0][idx] if results["metadatas"] else {}
                source = metadata.get("source", metadata.get("filename", "unknown"))

                retrieved_chunks.append(doc_text)
                retrieved_sources.append(source)
                retrieved_scores.append(score)

            # Keep the best matches first so citations are ordered by relevance.
            ordered = sorted(
                zip(retrieved_scores, retrieved_chunks, retrieved_sources),
                key=lambda item: item[0],
                reverse=True,
            )
            retrieved_scores = [item[0] for item in ordered]
            retrieved_chunks = [item[1] for item in ordered]
            retrieved_sources = [item[2] for item in ordered]

        if not retrieved_chunks:
            return {
                "question": question,
                "answer": "I'm sorry, this information does not exist in the SmartProcure Knowledge Base.",
                "sources": [],
                "confidence": 0.0,
                "degraded": False,
            }

        # Gate on the strongest match; averaging all top-k chunks punishes
        # correct answers whenever Chroma returns a few weak neighbours.
        best_score = retrieved_scores[0]
        avg_score = sum(retrieved_scores) / len(retrieved_scores)
        confidence = round(best_score * 100, 2)

        if best_score < threshold:
            logger.info(
                f"Best confidence {confidence}% below threshold "
                f"{threshold * 100}% (avg {avg_score * 100:.1f}%)"
            )
            return {
                "question": question,
                "answer": "I'm sorry, this information does not exist in the SmartProcure Knowledge Base.",
                "sources": [
                    {
                        "document": retrieved_sources[i],
                        "chunk": retrieved_chunks[i][:200],
                        "score": round(retrieved_scores[i], 4),
                    }
                    for i in range(len(retrieved_chunks))
                ],
                "confidence": confidence,
                "degraded": False,
            }

        degraded = False
        try:
            final_answer = await self.llm.generate(
                self.llm.build_rag_prompt(
                    question=question,
                    context_chunks=retrieved_chunks,
                    sources=retrieved_sources,
                )
            )
        except LLMUnavailableError as exc:
            logger.warning(f"LLM unavailable, returning excerpts: {exc}")
            degraded = True
            final_answer = (
                "AI summarisation is not configured, so here are the most relevant "
                "excerpts from the knowledge base instead:\n\n"
                + self._excerpts(retrieved_chunks, retrieved_sources)
            )
        except LLMError as exc:
            logger.error(f"LLM failed, returning excerpts: {exc}")
            degraded = True
            final_answer = (
                "The AI summariser is temporarily unavailable, so here are the most "
                "relevant excerpts from the knowledge base instead:\n\n"
                + self._excerpts(retrieved_chunks, retrieved_sources)
            )

        source_evidence = [
            {
                "document": retrieved_sources[i],
                "chunk": retrieved_chunks[i][:500],
                "score": round(retrieved_scores[i], 4),
            }
            for i in range(len(retrieved_chunks))
        ]

        return {
            "question": question,
            "answer": final_answer,
            "sources": source_evidence,
            "confidence": confidence,
            "degraded": degraded,
        }
