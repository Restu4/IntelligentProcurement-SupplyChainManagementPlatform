from typing import List, Tuple

from app.config.settings import settings
from app.database.chromadb import get_collection
from app.services.embedding_service import EmbeddingService
from app.services.llm_service import LLMService
from app.utils.logger import get_logger

logger = get_logger(__name__)


class RagService:

    def __init__(self):
        self.collection = get_collection()
        self.embedder = EmbeddingService()
        self.llm = LLMService()

    async def answer(self, question: str) -> dict:
        top_k = settings.RAG_TOP_K
        threshold = settings.CONFIDENCE_THRESHOLD

        query_embedding = self.embedder.embed(question)

        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )

        retrieved_chunks = []
        retrieved_sources = []
        retrieved_scores = []

        if results["documents"] and results["documents"][0]:
            distances = results["distances"][0] if results["distances"] else []
            for idx, doc_text in enumerate(results["documents"][0]):
                distance = distances[idx] if idx < len(distances) else 1.0
                score = 1.0 - distance
                metadata = results["metadatas"][0][idx] if results["metadatas"] else {}
                source = metadata.get("source", metadata.get("filename", "unknown"))

                retrieved_chunks.append(doc_text)
                retrieved_sources.append(source)
                retrieved_scores.append(score)

        if not retrieved_chunks:
            return {
                "question": question,
                "answer": "I'm sorry, this information does not exist in the SmartProcure Knowledge Base.",
                "sources": [],
                "confidence": 0.0,
            }

        avg_score = sum(retrieved_scores) / len(retrieved_scores)
        confidence = round(avg_score * 100, 2)

        if avg_score < threshold:
            logger.info(f"Confidence {confidence}% below threshold {threshold*100}%")
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
            }

        if self.llm.is_available():
            rag_prompt = self.llm.build_rag_prompt(
                question=question,
                context_chunks=retrieved_chunks,
                sources=retrieved_sources,
            )
            final_answer = await self.llm.generate(rag_prompt)
        else:
            best = retrieved_chunks[0][:500]
            final_answer = f"Based on the knowledge base, here is what I found:\n\n{best}"

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
        }
