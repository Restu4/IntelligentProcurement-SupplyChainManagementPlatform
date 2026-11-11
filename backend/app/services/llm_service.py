from typing import List

from app.config.settings import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

_client = None


class LLMError(RuntimeError):
    """Raised when the LLM cannot produce an answer."""


class LLMUnavailableError(LLMError):
    """Raised when no API key is configured."""


def _get_client():
    """Create the google-genai client lazily so imports stay cheap."""
    global _client
    if _client is None:
        from google import genai

        _client = genai.Client(api_key=settings.GEMINI_API_KEY)
    return _client


class LLMService:

    DEFAULT_MODEL = "gemini-2.0-flash"

    @staticmethod
    def is_available() -> bool:
        return bool(settings.GEMINI_API_KEY)

    @staticmethod
    async def generate(
        prompt: str,
        model_name: str | None = None,
        temperature: float = 0.3,
        max_output_tokens: int = 1024,
    ) -> str:
        """Call Gemini asynchronously.

        Raises ``LLMUnavailableError``/``LLMError`` instead of returning an
        error message as if it were a real answer.
        """
        if not settings.GEMINI_API_KEY:
            raise LLMUnavailableError("GEMINI_API_KEY is not configured")

        try:
            from google.genai import types

            response = await _get_client().aio.models.generate_content(
                model=model_name or settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                ),
            )
        except Exception as exc:  # network, quota, invalid key, SDK errors
            logger.error(f"Gemini API error: {exc}", exc_info=True)
            raise LLMError("Gemini request failed") from exc

        text = (getattr(response, "text", None) or "").strip()
        if not text:
            raise LLMError("Gemini returned an empty response")
        return text

    @staticmethod
    def build_rag_prompt(
        question: str,
        context_chunks: List[str],
        sources: List[str],
    ) -> str:
        context_text = "\n\n---\n\n".join(
            f"[Source: {src}]\n{chunk}"
            for chunk, src in zip(context_chunks, sources)
        )

        prompt = f"""You are SmartProcure AI, an intelligent procurement and supply chain assistant.

Answer the user's question based ONLY on the provided knowledge base context below.

If the context does not contain enough information to answer the question confidently, say:
"I'm sorry, this information does not exist in the SmartProcure Knowledge Base."

Do NOT invent or hallucinate any procurement information.

=== CONTEXT ===
{context_text}

=== QUESTION ===
{question}

=== INSTRUCTION ===
Provide a clear, concise answer. At the end, list the source document names you used."""
        return prompt
