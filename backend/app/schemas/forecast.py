from pydantic import BaseModel, Field


class ForecastRequest(BaseModel):
    supplier_id: int | None = None
    forecast_type: str = Field(..., pattern="^(price|risk|budget|demand)$")
    parameters: dict = Field(default_factory=dict)


class ForecastResponse(BaseModel):
    supplier_id: int | None
    forecast_type: str
    result: dict
    confidence: float


class ForecastHistoryResponse(BaseModel):
    id: int
    supplier_id: int | None
    forecast_type: str
    parameters: str | None
    result: str | None
    confidence: float | None
    created_at: str

    class Config:
        from_attributes = True
