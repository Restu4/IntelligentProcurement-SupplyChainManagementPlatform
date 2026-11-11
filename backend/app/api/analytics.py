from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.postgres import get_db
from app.models.user import User
from app.schemas.analytics import AnalyticsOverview, ReportSummary
from app.services.analytics_service import build_overview, build_report_summary
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Analytics"])


@router.get("/analytics/overview", response_model=AnalyticsOverview)
async def analytics_overview(
    fiscal_year: Optional[int] = Query(None, ge=2000, le=2100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await build_overview(db, fiscal_year)


@router.get("/reports/summary", response_model=ReportSummary)
async def report_summary(
    fiscal_year: Optional[int] = Query(None, ge=2000, le=2100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await build_report_summary(db, fiscal_year)
