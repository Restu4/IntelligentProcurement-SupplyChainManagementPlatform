from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
import json

from app.database.postgres import get_db
from app.models.user import User
from app.models.forecast import ForecastHistory
from app.models.budget import Budget
from app.models.supplier import Supplier
from app.schemas.forecast import ForecastRequest, ForecastResponse, ForecastHistoryResponse
from app.services.forecast_service import ForecastService
from app.utils.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Forecast"])


@router.post("/forecast", response_model=ForecastResponse)
async def create_forecast(
    body: ForecastRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    forecast_type = body.forecast_type
    result = None
    confidence = 0.0

    if forecast_type == "price":
        result = await ForecastService.forecast_price(
            body.parameters.get("historical_prices", []),
            body.parameters.get("periods", 3),
        )
        confidence = result.get("confidence", 0.0)

    elif forecast_type == "risk":
        supplier_id = body.supplier_id
        if not supplier_id:
            raise HTTPException(status_code=400, detail="supplier_id required for risk forecast")
        sup_result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
        supplier = sup_result.scalar_one_or_none()
        if not supplier:
            raise HTTPException(status_code=404, detail="Supplier not found")
        result = await ForecastService.classify_risk(
            delivery_score=supplier.delivery_score,
            quality_score=supplier.quality_score,
            late_deliveries=body.parameters.get("late_deliveries", 0),
            total_orders=body.parameters.get("total_orders", 1),
        )
        confidence = 1.0 - ({"high": 0.7, "medium": 0.4, "low": 0.1}.get(result.get("risk_level"), 0.5))

    elif forecast_type == "budget":
        budget_id = body.parameters.get("budget_id")
        if budget_id:
            b_result = await db.execute(select(Budget).where(Budget.id == budget_id))
            budget = b_result.scalar_one_or_none()
            if not budget:
                raise HTTPException(status_code=404, detail="Budget not found")
            result = await ForecastService.budget_recommendation(
                total_budget=budget.total_budget,
                allocated=budget.allocated,
                pending_requests=body.parameters.get("pending_requests", []),
            )
        else:
            result = await ForecastService.budget_recommendation(
                total_budget=body.parameters.get("total_budget", 0),
                allocated=body.parameters.get("allocated", 0),
                pending_requests=body.parameters.get("pending_requests", []),
            )
        confidence = 0.85 if result.get("status") != "unknown" else 0.5

    elif forecast_type == "demand":
        result = {
            "forecast": body.parameters.get("historical_demand", []),
            "method": "placeholder",
            "note": "Demand forecasting requires historical PO data. Preparing architecture.",
        }
        confidence = 0.5

    else:
        raise HTTPException(status_code=400, detail=f"Unknown forecast type: {forecast_type}")

    forecast_record = ForecastHistory(
        supplier_id=body.supplier_id,
        forecast_type=forecast_type,
        parameters=json.dumps(body.parameters, ensure_ascii=False),
        result=json.dumps(result, ensure_ascii=False),
        confidence=confidence,
    )
    db.add(forecast_record)
    await db.flush()

    return ForecastResponse(
        supplier_id=body.supplier_id,
        forecast_type=forecast_type,
        result=result,
        confidence=confidence,
    )


@router.get("/forecast", response_model=list[ForecastHistoryResponse])
async def get_forecast_history(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    supplier_id: int | None = Query(None, gt=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(ForecastHistory)
    if supplier_id:
        query = query.where(ForecastHistory.supplier_id == supplier_id)
    result = await db.execute(
        query.order_by(desc(ForecastHistory.created_at), desc(ForecastHistory.id))
        .limit(limit)
        .offset(offset)
    )
    records = result.scalars().all()
    return [
        ForecastHistoryResponse(
            id=r.id,
            supplier_id=r.supplier_id,
            forecast_type=r.forecast_type,
            parameters=r.parameters,
            result=r.result,
            confidence=r.confidence,
            created_at=r.created_at.isoformat() if r.created_at else "",
        )
        for r in records
    ]


@router.get("/forecast/smart-buy")
async def smart_buy_recommendation(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Supplier).where(Supplier.status == "active"))
    suppliers = result.scalars().all()

    supplier_data = [
        {
            "name": s.name,
            "delivery_score": s.delivery_score or 0,
            "quality_score": s.quality_score or 0,
            "price_competitiveness": 0.8,
        }
        for s in suppliers
    ]

    recommendation = await ForecastService.smart_buy_recommendation(supplier_data)
    return recommendation
