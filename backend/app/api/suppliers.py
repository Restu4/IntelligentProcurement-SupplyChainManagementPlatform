from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import Optional

from app.database.postgres import get_db
from app.models.user import User
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierResponse, SupplierCreate
from app.services.forecast_service import ForecastService
from app.utils.auth import get_current_user, require_admin
from app.utils.audit import record_audit

router = APIRouter(prefix="/api", tags=["Suppliers"])


@router.get("/suppliers", response_model=list[SupplierResponse])
async def list_suppliers(
    status: Optional[str] = Query(None, max_length=50),
    risk_level: Optional[str] = Query(None, max_length=50),
    category: Optional[str] = Query(None, max_length=100),
    q: Optional[str] = Query(None, max_length=200),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Supplier)
    if status:
        query = query.where(Supplier.status == status)
    if risk_level:
        query = query.where(Supplier.risk_level == risk_level)
    if category:
        query = query.where(Supplier.category == category)
    if q:
        term = f"%{q.strip()}%"
        query = query.where(Supplier.name.ilike(term))
    query = (
        query.order_by(desc(Supplier.created_at), desc(Supplier.id))
        .limit(limit)
        .offset(offset)
    )

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
async def get_supplier(
    supplier_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.post("/suppliers", response_model=SupplierResponse, status_code=201)
async def create_supplier(
    body: SupplierCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    supplier = Supplier(**body.model_dump())
    db.add(supplier)
    await db.flush()
    await db.refresh(supplier)
    await record_audit(
        db,
        user=current_user,
        action="supplier.created",
        entity_type="supplier",
        entity_id=supplier.id,
        detail={"name": supplier.name, "status": supplier.status},
        request=request,
    )
    return supplier


@router.get("/suppliers/{supplier_id}/risk")
async def assess_supplier_risk(
    supplier_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    risk = await ForecastService.classify_risk(
        delivery_score=supplier.delivery_score,
        quality_score=supplier.quality_score,
    )
    return {
        "supplier_id": supplier.id,
        "supplier_name": supplier.name,
        **risk,
    }
