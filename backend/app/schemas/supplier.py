from pydantic import BaseModel, Field

from app.schemas.common import UtcDatetime


class SupplierResponse(BaseModel):
    id: int
    name: str
    contact_person: str | None
    email: str | None
    phone: str | None
    address: str | None
    category: str | None
    status: str
    risk_level: str | None
    delivery_score: float | None
    quality_score: float | None
    evaluation_notes: str | None
    created_at: UtcDatetime

    class Config:
        from_attributes = True


class SupplierCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    contact_person: str = Field(default="", max_length=255)
    email: str = Field(default="", max_length=255)
    phone: str = Field(default="", max_length=50)
    address: str = Field(default="")
    category: str = Field(default="", max_length=100)
    status: str = Field(default="active", max_length=50)
    risk_level: str = Field(default="low", max_length=50)
    delivery_score: float | None = None
    quality_score: float | None = None
    evaluation_notes: str = Field(default="")
