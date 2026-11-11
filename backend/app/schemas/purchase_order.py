from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.schemas.common import UtcDatetime

POStatus = Literal[
    "draft",
    "pending",
    "approved",
    "rejected",
    "completed",
    "cancelled",
]

PO_STATUSES: tuple[str, ...] = (
    "draft",
    "pending",
    "approved",
    "rejected",
    "completed",
    "cancelled",
)


class PurchaseOrderCreate(BaseModel):
    supplier_id: int = Field(..., gt=0)
    description: str | None = Field(default=None, max_length=2000)
    amount: float = Field(..., gt=0)
    notes: str | None = Field(default=None, max_length=2000)
    status: POStatus = "draft"
    # Optional: when omitted the backend generates PO-<year>-<sequence>.
    po_number: str | None = Field(default=None, max_length=100)

    @field_validator("po_number")
    @classmethod
    def normalize_po_number(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip().upper()
        return cleaned or None


class PurchaseOrderUpdate(BaseModel):
    supplier_id: int | None = Field(default=None, gt=0)
    description: str | None = Field(default=None, max_length=2000)
    amount: float | None = Field(default=None, gt=0)
    notes: str | None = Field(default=None, max_length=2000)
    status: POStatus | None = None


class PurchaseOrderResponse(BaseModel):
    id: int
    po_number: str
    supplier_id: int
    supplier_name: str | None = None
    user_id: int
    description: str | None
    amount: float
    status: str
    approval_level: str | None
    notes: str | None
    created_at: UtcDatetime
    updated_at: UtcDatetime

    class Config:
        from_attributes = True
