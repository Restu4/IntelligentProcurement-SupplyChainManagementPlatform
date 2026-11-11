import asyncio

from fastapi import APIRouter

from app.config.settings import settings
from app.database.chromadb import get_chroma_client
from app.services.llm_service import LLMService
from app.schemas.health import HealthResponse

router = APIRouter(prefix="/api", tags=["Health"])


@router.get("/health", response_model=HealthResponse)
async def health_check():
    db_status = "disconnected"
    try:
        from app.database.postgres import engine
        async with engine.connect() as conn:
            await conn.execute(
                __import__("sqlalchemy").text("SELECT 1")
            )
        db_status = "connected"
    except Exception:
        db_status = "disconnected"

    chroma_status = "disconnected"
    try:
        client = get_chroma_client()
        await asyncio.to_thread(client.heartbeat)
        chroma_status = "connected"
    except Exception:
        chroma_status = "disconnected"

    gemini_status = "configured" if LLMService.is_available() else "not configured"

    return HealthResponse(
        status="healthy",
        version="1.0.0",
        database=db_status,
        chromadb=chroma_status,
        gemini=gemini_status,
    )
