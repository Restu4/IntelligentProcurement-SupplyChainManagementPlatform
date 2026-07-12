from fastapi import APIRouter, Depends, HTTPException
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

        chat_entry = ChatHistory(
            user_id=current_user.id,
            question=body.question,
            answer=result["answer"],
            confidence=result["confidence"],
            sources_json=json.dumps(result["sources"], ensure_ascii=False),
        )
        db.add(chat_entry)
        await db.flush()

        return ChatResponse(
            question=result["question"],
            answer=result["answer"],
            sources=result["sources"],
            confidence=result["confidence"],
        )
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")


@router.get("/history", response_model=list[HistoryResponse])
async def get_history(
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(ChatHistory)
        .where(ChatHistory.user_id == current_user.id)
        .order_by(desc(ChatHistory.created_at))
        .limit(limit)
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
