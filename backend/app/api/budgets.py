from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.postgres import get_db
from app.models.budget import Budget
from app.models.user import User
from app.schemas.budget import (
    BudgetCreate,
    BudgetResponse,
    BudgetSummary,
    BudgetUpdate,
)
from app.schemas.common import Page
from app.utils.auth import get_current_user, require_admin
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["Budgets"])


def _utilization(total: float, allocated: float) -> float:
    if total <= 0:
        return 0.0
    return round((allocated / total) * 100, 2)


def _to_response(budget: Budget) -> BudgetResponse:
    return BudgetResponse(
        id=budget.id,
        department=budget.department,
        fiscal_year=budget.fiscal_year,
        total_budget=budget.total_budget,
        allocated=budget.allocated,
        remaining=budget.remaining,
        utilization=_utilization(budget.total_budget, budget.allocated),
        created_at=budget.created_at,
        updated_at=budget.updated_at,
    )


def _recompute_remaining(budget: Budget) -> None:
    budget.remaining = round(budget.total_budget - budget.allocated, 2)


async def _find_duplicate(
    db: AsyncSession,
    department: str,
    fiscal_year: int,
    exclude_id: int | None = None,
) -> Budget | None:
    stmt = select(Budget).where(
        func.lower(Budget.department) == department.strip().lower(),
        Budget.fiscal_year == fiscal_year,
    )
    if exclude_id is not None:
        stmt = stmt.where(Budget.id != exclude_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


@router.get("/budgets", response_model=Page[BudgetResponse])
async def list_budgets(
    fiscal_year: Optional[int] = Query(None, ge=2000, le=2100),
    department: Optional[str] = Query(None, max_length=255),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    conditions = []
    if fiscal_year:
        conditions.append(Budget.fiscal_year == fiscal_year)
    if department:
        conditions.append(Budget.department.ilike(f"%{department.strip()}%"))

    count_stmt = select(func.count(Budget.id))
    stmt = select(Budget)
    for condition in conditions:
        count_stmt = count_stmt.where(condition)
        stmt = stmt.where(condition)

    total = (await db.execute(count_stmt)).scalar_one()
    result = await db.execute(
        stmt.order_by(Budget.fiscal_year.desc(), Budget.department.asc())
        .limit(limit)
        .offset(offset)
    )

    return Page[BudgetResponse](
        items=[_to_response(budget) for budget in result.scalars().all()],
        total=total,
        limit=limit,
        offset=offset,
    )


# Declared before /budgets/{budget_id} so "summary" is not parsed as an id.
@router.get("/budgets/summary", response_model=BudgetSummary)
async def budget_summary(
    fiscal_year: Optional[int] = Query(None, ge=2000, le=2100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    year = fiscal_year or datetime.now(timezone.utc).year

    result = await db.execute(
        select(
            func.count(Budget.id),
            func.coalesce(func.sum(Budget.total_budget), 0.0),
            func.coalesce(func.sum(Budget.allocated), 0.0),
            func.coalesce(func.sum(Budget.remaining), 0.0),
        ).where(Budget.fiscal_year == year)
    )
    count, total_budget, allocated, remaining = result.one()

    return BudgetSummary(
        fiscal_year=year,
        departments=int(count or 0),
        total_budget=float(total_budget or 0.0),
        allocated=float(allocated or 0.0),
        remaining=float(remaining or 0.0),
        utilization=_utilization(float(total_budget or 0.0), float(allocated or 0.0)),
    )


@router.get("/budgets/{budget_id}", response_model=BudgetResponse)
async def get_budget(
    budget_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    budget = await db.get(Budget, budget_id)
    if budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")
    return _to_response(budget)


@router.post("/budgets", response_model=BudgetResponse, status_code=201)
async def create_budget(
    body: BudgetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    if await _find_duplicate(db, body.department, body.fiscal_year):
        raise HTTPException(
            status_code=409,
            detail="A budget for this department and fiscal year already exists",
        )

    budget = Budget(
        department=body.department.strip(),
        fiscal_year=body.fiscal_year,
        total_budget=body.total_budget,
        allocated=body.allocated,
        remaining=0.0,
    )
    _recompute_remaining(budget)
    db.add(budget)
    await db.flush()
    await db.refresh(budget)
    logger.info(
        f"Created budget {budget.department} {budget.fiscal_year} "
        f"(Rp {budget.total_budget:,.0f})"
    )
    return _to_response(budget)


@router.patch("/budgets/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: int,
    body: BudgetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    budget = await db.get(Budget, budget_id)
    if budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")

    changes = body.model_dump(exclude_unset=True)
    if not changes:
        return _to_response(budget)

    new_department = changes.get("department", budget.department)
    new_year = changes.get("fiscal_year", budget.fiscal_year)
    if await _find_duplicate(db, new_department, new_year, exclude_id=budget.id):
        raise HTTPException(
            status_code=409,
            detail="A budget for this department and fiscal year already exists",
        )

    budget.department = new_department.strip()
    budget.fiscal_year = new_year
    if "total_budget" in changes:
        budget.total_budget = changes["total_budget"]
    if "allocated" in changes:
        if changes["allocated"] > budget.total_budget:
            raise HTTPException(
                status_code=400,
                detail="Allocated amount cannot exceed the total budget",
            )
        budget.allocated = changes["allocated"]

    if budget.allocated > budget.total_budget:
        raise HTTPException(
            status_code=400,
            detail="Allocated amount cannot exceed the total budget",
        )

    _recompute_remaining(budget)
    await db.flush()
    await db.refresh(budget)
    return _to_response(budget)


@router.delete("/budgets/{budget_id}", status_code=204)
async def delete_budget(
    budget_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    budget = await db.get(Budget, budget_id)
    if budget is None:
        raise HTTPException(status_code=404, detail="Budget not found")
    await db.delete(budget)
    await db.flush()
    logger.info(f"Deleted budget {budget.department} {budget.fiscal_year}")
