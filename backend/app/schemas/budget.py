from pydantic import BaseModel, Field

from app.schemas.common import UtcDatetime


class BudgetCreate(BaseModel):
    department: str = Field(..., min_length=1, max_length=255)
    fiscal_year: int = Field(..., ge=2000, le=2100)
    total_budget: float = Field(default=0.0, ge=0)
    allocated: float = Field(default=0.0, ge=0)


class BudgetUpdate(BaseModel):
    department: str | None = Field(default=None, min_length=1, max_length=255)
    fiscal_year: int | None = Field(default=None, ge=2000, le=2100)
    total_budget: float | None = Field(default=None, ge=0)
    allocated: float | None = Field(default=None, ge=0)


class BudgetResponse(BaseModel):
    id: int
    department: str
    fiscal_year: int
    total_budget: float
    allocated: float
    remaining: float
    utilization: float = Field(
        description="Allocated divided by total budget, as a percentage."
    )
    created_at: UtcDatetime
    updated_at: UtcDatetime

    class Config:
        from_attributes = True


class BudgetSummary(BaseModel):
    fiscal_year: int
    departments: int
    total_budget: float
    allocated: float
    remaining: float
    utilization: float
