import google.generativeai as genai
from typing import List, Optional

from app.config.settings import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

_genai_configured = False


def _ensure_configured():
    global _genai_configured
    if not _genai_configured and settings.GEMINI_API_KEY:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        _genai_configured = True


class LLMService:

    DEFAULT_MODEL = "gemini-2.0-flash"

    @staticmethod
    def is_available() -> bool:
        return bool(settings.GEMINI_API_KEY)

    @staticmethod
    async def generate(
        prompt: str,
        model_name: str = DEFAULT_MODEL,
        temperature: float = 0.3,
        max_output_tokens: int = 1024,
    ) -> str:
        _ensure_configured()
        if not settings.GEMINI_API_KEY:
            logger.warning("Gemini API key not configured")
            return "Gemini API is not configured. Please set GEMINI_API_KEY in .env"

        try:
            model = genai.GenerativeModel(model_name)
            response = model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_output_tokens,
                ),
            )
            return response.text
        except Exception as e:
            logger.error(f"Gemini API error: {e}")
            return f"An error occurred while contacting Gemini API: {str(e)}"

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
