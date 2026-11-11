from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.postgres import get_db
from app.models.audit_log import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogResponse
from app.schemas.common import Page
from app.utils.auth import require_admin

router = APIRouter(prefix="/api", tags=["Audit"])


@router.get("/audit-logs", response_model=Page[AuditLogResponse])
async def list_audit_logs(
    action: Optional[str] = Query(None, max_length=100),
    entity_type: Optional[str] = Query(None, max_length=100),
    user_id: Optional[int] = Query(None, gt=0),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    conditions = []
    if action:
        conditions.append(AuditLog.action == action)
    if entity_type:
        conditions.append(AuditLog.entity_type == entity_type)
    if user_id:
        conditions.append(AuditLog.user_id == user_id)

    count_stmt = select(func.count(AuditLog.id))
    stmt = select(AuditLog)
    for condition in conditions:
        count_stmt = count_stmt.where(condition)
        stmt = stmt.where(condition)

    total = (await db.execute(count_stmt)).scalar_one()
    result = await db.execute(
        stmt.order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
        .limit(limit)
        .offset(offset)
    )

    return Page[AuditLogResponse](
        items=[AuditLogResponse.model_validate(row) for row in result.scalars().all()],
        total=total,
        limit=limit,
        offset=offset,
    )
