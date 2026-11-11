from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import json

from app.database.postgres import get_db
from app.models.user import User
from app.models.chat import ChatHistory
from app.schemas.chat import ChatRequest, ChatResponse, HistoryResponse
from app.services.rag_service import RagService
from app.utils.auth import get_current_user
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["Chat"])
rag_service = RagService()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        result = await rag_service.answer(body.question)
    except Exception:
        # Never leak internal exception text to the client as an "answer".
        logger.exception("Chat processing failed")
        raise HTTPException(
            status_code=500,
            detail="The AI assistant is temporarily unavailable. Please try again.",
        )

    try:
        db.add(
            ChatHistory(
                user_id=current_user.id,
                question=body.question,
                answer=result["answer"],
                confidence=result["confidence"],
                sources_json=json.dumps(result["sources"], ensure_ascii=False),
            )
        )
        await db.flush()
    except Exception:
        # A failed history write must not discard a valid answer.
        await db.rollback()
        logger.warning("Could not persist chat history", exc_info=True)

    return ChatResponse(
        question=result["question"],
        answer=result["answer"],
        sources=result["sources"],
        confidence=result["confidence"],
        degraded=result.get("degraded", False),
    )


@router.get("/history", response_model=list[HistoryResponse])
async def get_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChatHistory)
        .where(ChatHistory.user_id == current_user.id)
        .order_by(desc(ChatHistory.created_at), desc(ChatHistory.id))
        .limit(limit)
        .offset(offset)
    )
    records = result.scalars().all()
    return [
        HistoryResponse(
            id=r.id,
            question=r.question,
            answer=r.answer,
            confidence=r.confidence,
            sources_json=r.sources_json,
            created_at=r.created_at.isoformat() if r.created_at else "",
        )
        for r in records
    ]
