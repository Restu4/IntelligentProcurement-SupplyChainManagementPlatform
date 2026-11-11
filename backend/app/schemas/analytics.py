from pydantic import BaseModel, Field

from app.schemas.common import UtcDatetime


class AnalyticsTotals(BaseModel):
    total_budget: float
    allocated: float
    remaining: float
    utilization: float
    spend: float = Field(
        description="Sum of approved and completed purchase orders."
    )
    pending_amount: float
    purchase_orders: int
    avg_order_value: float
    active_suppliers: int
    high_risk_suppliers: int
    documents: int
    pending_pos: int
    completed_pos: int


class MonthlyPoint(BaseModel):
    month: str
    month_number: int
    orders: int
    spend: float


class CategorySpend(BaseModel):
    category: str
    spend: float
    share: float = Field(description="Percentage of total spend.")


class StatusBreakdown(BaseModel):
    status: str
    count: int
    amount: float


class AnalyticsOverview(BaseModel):
    fiscal_year: int
    totals: AnalyticsTotals
    monthly: list[MonthlyPoint]
    categories: list[CategorySpend]
    status_breakdown: list[StatusBreakdown]
    generated_at: UtcDatetime


class ReportBudgetRow(BaseModel):
    department: str
    fiscal_year: int
    total_budget: float
    allocated: float
    remaining: float
    utilization: float


class ReportSupplierRow(BaseModel):
    name: str
    category: str | None
    status: str
    risk_level: str | None
    delivery_score: float | None
    quality_score: float | None


class ReportPurchaseOrderRow(BaseModel):
    po_number: str
    supplier_name: str | None
    amount: float
    status: str
    approval_level: str | None
    created_at: UtcDatetime


class ReportSummary(BaseModel):
    fiscal_year: int
    generated_at: UtcDatetime
    totals: AnalyticsTotals
    budgets: list[ReportBudgetRow]
    suppliers: list[ReportSupplierRow]
    purchase_orders: list[ReportPurchaseOrderRow]
