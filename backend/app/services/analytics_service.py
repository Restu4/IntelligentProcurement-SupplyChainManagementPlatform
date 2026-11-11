"""Read-only aggregation for the analytics and reports screens.

Aggregations are deliberately computed in Python: the project supports both
SQLite (development) and PostgreSQL (production), and month bucketing differs
between the two dialects. Dataset sizes here are small; if that changes the
monthly/status rollups can move to dialect-specific SQL.
"""

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.budget import Budget
from app.models.document import Document
from app.models.purchase_order import PurchaseOrder
from app.models.supplier import Supplier
from app.schemas.analytics import (
    AnalyticsOverview,
    AnalyticsTotals,
    CategorySpend,
    MonthlyPoint,
    ReportBudgetRow,
    ReportPurchaseOrderRow,
    ReportSummary,
    ReportSupplierRow,
    StatusBreakdown,
)

SPEND_STATUSES = {"approved", "completed"}
PO_STATUSES = ("draft", "pending", "approved", "rejected", "completed", "cancelled")
MONTH_LABELS = (
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
)


def _current_year() -> int:
    return datetime.now(timezone.utc).year


def _utilization(total: float, allocated: float) -> float:
    if total <= 0:
        return 0.0
    return round((allocated / total) * 100, 2)


async def _load_year_data(db: AsyncSession, fiscal_year: int):
    start = datetime(fiscal_year, 1, 1)
    end = datetime(fiscal_year + 1, 1, 1)

    budget_rows = (
        await db.execute(
            select(Budget)
            .where(Budget.fiscal_year == fiscal_year)
            .order_by(Budget.department.asc())
        )
    ).scalars().all()

    supplier_rows = (
        await db.execute(select(Supplier).order_by(Supplier.name.asc()))
    ).scalars().all()

    po_rows = (
        await db.execute(
            select(PurchaseOrder, Supplier.name, Supplier.category)
            .join(Supplier, PurchaseOrder.supplier_id == Supplier.id, isouter=True)
            .where(
                PurchaseOrder.created_at >= start,
                PurchaseOrder.created_at < end,
            )
            .order_by(PurchaseOrder.created_at.desc(), PurchaseOrder.id.desc())
        )
    ).all()

    document_count = (
        await db.execute(select(func.count(Document.id)))
    ).scalar_one()

    return budget_rows, supplier_rows, po_rows, int(document_count or 0)


def _totals(
    budget_rows,
    supplier_rows,
    po_rows,
    document_count: int,
) -> AnalyticsTotals:
    total_budget = round(sum(b.total_budget for b in budget_rows), 2)
    allocated = round(sum(b.allocated for b in budget_rows), 2)
    remaining = round(sum(b.remaining for b in budget_rows), 2)

    spend = round(
        sum(float(po.amount) for po, _, _ in po_rows if po.status in SPEND_STATUSES),
        2,
    )
    pending_amount = round(
        sum(float(po.amount) for po, _, _ in po_rows if po.status == "pending"),
        2,
    )
    completed = sum(1 for po, _, _ in po_rows if po.status == "completed")
    pending = sum(1 for po, _, _ in po_rows if po.status == "pending")
    spend_orders = sum(1 for po, _, _ in po_rows if po.status in SPEND_STATUSES)

    return AnalyticsTotals(
        total_budget=total_budget,
        allocated=allocated,
        remaining=remaining,
        utilization=_utilization(total_budget, allocated),
        spend=spend,
        pending_amount=pending_amount,
        purchase_orders=len(po_rows),
        avg_order_value=round(spend / spend_orders, 2) if spend_orders else 0.0,
        active_suppliers=sum(1 for s in supplier_rows if s.status == "active"),
        high_risk_suppliers=sum(1 for s in supplier_rows if s.risk_level == "high"),
        documents=document_count,
        pending_pos=pending,
        completed_pos=completed,
    )


def _monthly(po_rows) -> list[MonthlyPoint]:
    orders = [0] * 12
    spend = [0.0] * 12

    for po, _, _ in po_rows:
        if po.created_at is None:
            continue
        index = po.created_at.month - 1
        orders[index] += 1
        if po.status in SPEND_STATUSES:
            spend[index] += float(po.amount)

    return [
        MonthlyPoint(
            month=MONTH_LABELS[index],
            month_number=index + 1,
            orders=orders[index],
            spend=round(spend[index], 2),
        )
        for index in range(12)
    ]


def _categories(po_rows) -> list[CategorySpend]:
    totals: dict[str, float] = {}
    for po, _, category in po_rows:
        if po.status not in SPEND_STATUSES:
            continue
        key = category or "Uncategorised"
        totals[key] = totals.get(key, 0.0) + float(po.amount)

    grand_total = sum(totals.values())
    return [
        CategorySpend(
            category=category,
            spend=round(amount, 2),
            share=round((amount / grand_total) * 100, 2) if grand_total else 0.0,
        )
        for category, amount in sorted(
            totals.items(), key=lambda item: item[1], reverse=True
        )
    ]


def _status_breakdown(po_rows) -> list[StatusBreakdown]:
    counts = {status: 0 for status in PO_STATUSES}
    amounts = {status: 0.0 for status in PO_STATUSES}
    for po, _, _ in po_rows:
        if po.status in counts:
            counts[po.status] += 1
            amounts[po.status] += float(po.amount)
    return [
        StatusBreakdown(
            status=status,
            count=counts[status],
            amount=round(amounts[status], 2),
        )
        for status in PO_STATUSES
    ]


async def build_overview(
    db: AsyncSession, fiscal_year: int | None = None
) -> AnalyticsOverview:
    year = fiscal_year or _current_year()
    budget_rows, supplier_rows, po_rows, document_count = await _load_year_data(
        db, year
    )

    return AnalyticsOverview(
        fiscal_year=year,
        totals=_totals(budget_rows, supplier_rows, po_rows, document_count),
        monthly=_monthly(po_rows),
        categories=_categories(po_rows),
        status_breakdown=_status_breakdown(po_rows),
        generated_at=datetime.now(timezone.utc),
    )


async def build_report_summary(
    db: AsyncSession, fiscal_year: int | None = None
) -> ReportSummary:
    year = fiscal_year or _current_year()
    budget_rows, supplier_rows, po_rows, document_count = await _load_year_data(
        db, year
    )

    budgets = [
        ReportBudgetRow(
            department=b.department,
            fiscal_year=b.fiscal_year,
            total_budget=b.total_budget,
            allocated=b.allocated,
            remaining=b.remaining,
            utilization=_utilization(b.total_budget, b.allocated),
        )
        for b in budget_rows
    ]

    suppliers = [
        ReportSupplierRow(
            name=s.name,
            category=s.category,
            status=s.status,
            risk_level=s.risk_level,
            delivery_score=s.delivery_score,
            quality_score=s.quality_score,
        )
        for s in supplier_rows
    ]

    purchase_orders = [
        ReportPurchaseOrderRow(
            po_number=po.po_number,
            supplier_name=supplier_name,
            amount=po.amount,
            status=po.status,
            approval_level=po.approval_level,
            created_at=po.created_at,
        )
        for po, supplier_name, _ in po_rows
    ]

    return ReportSummary(
        fiscal_year=year,
        generated_at=datetime.now(timezone.utc),
        totals=_totals(budget_rows, supplier_rows, po_rows, document_count),
        budgets=budgets,
        suppliers=suppliers,
        purchase_orders=purchase_orders,
    )
