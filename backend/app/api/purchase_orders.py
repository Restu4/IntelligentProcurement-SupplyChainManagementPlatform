from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.postgres import get_db
from app.models.purchase_order import PurchaseOrder
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.common import Page
from app.schemas.purchase_order import (
    PurchaseOrderCreate,
    PurchaseOrderResponse,
    PurchaseOrderUpdate,
)
from app.services.purchase_order_service import (
    AMENDMENT_REAPPROVAL_RATIO,
    approval_level_for,
    can_transition,
    create_with_unique_number,
)
from app.utils.auth import get_current_user, require_admin
from app.utils.audit import record_audit
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter(prefix="/api", tags=["Purchase Orders"])


def _to_response(po: PurchaseOrder, supplier_name: str | None) -> PurchaseOrderResponse:
    return PurchaseOrderResponse(
        id=po.id,
        po_number=po.po_number,
        supplier_id=po.supplier_id,
        supplier_name=supplier_name,
        user_id=po.user_id,
        description=po.description,
        amount=po.amount,
        status=po.status,
        approval_level=po.approval_level,
        notes=po.notes,
        created_at=po.created_at,
        updated_at=po.updated_at,
    )


async def _get_supplier_or_404(db: AsyncSession, supplier_id: int) -> Supplier:
    result = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result.scalar_one_or_none()
    if supplier is None:
        raise HTTPException(status_code=404, detail="Supplier not found")
    if supplier.status == "blacklisted":
        raise HTTPException(
            status_code=400,
            detail="Supplier is blacklisted and cannot receive new purchase orders",
        )
    return supplier


async def _get_po_or_404(db: AsyncSession, po_id: int) -> tuple[PurchaseOrder, str | None]:
    result = await db.execute(
        select(PurchaseOrder, Supplier.name)
        .join(Supplier, PurchaseOrder.supplier_id == Supplier.id, isouter=True)
        .where(PurchaseOrder.id == po_id)
    )
    row = result.first()
    if row is None:
        raise HTTPException(status_code=404, detail="Purchase order not found")
    return row[0], row[1]


@router.get("/purchase-orders", response_model=Page[PurchaseOrderResponse])
async def list_purchase_orders(
    status: Optional[str] = Query(None, max_length=50),
    supplier_id: Optional[int] = Query(None, gt=0),
    q: Optional[str] = Query(None, max_length=200),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    stmt = select(PurchaseOrder, Supplier.name).join(
        Supplier, PurchaseOrder.supplier_id == Supplier.id, isouter=True
    )
    count_stmt = (
        select(func.count(PurchaseOrder.id))
        .select_from(PurchaseOrder)
        .join(Supplier, PurchaseOrder.supplier_id == Supplier.id, isouter=True)
    )

    conditions = []
    if status:
        conditions.append(PurchaseOrder.status == status)
    if supplier_id:
        conditions.append(PurchaseOrder.supplier_id == supplier_id)
    if q:
        term = f"%{q.strip()}%"
        conditions.append(
            or_(
                PurchaseOrder.po_number.ilike(term),
                PurchaseOrder.description.ilike(term),
                Supplier.name.ilike(term),
            )
        )

    for condition in conditions:
        stmt = stmt.where(condition)
        count_stmt = count_stmt.where(condition)

    total = (await db.execute(count_stmt)).scalar_one()

    result = await db.execute(
        stmt.order_by(PurchaseOrder.created_at.desc(), PurchaseOrder.id.desc())
        .limit(limit)
        .offset(offset)
    )

    return Page[PurchaseOrderResponse](
        items=[_to_response(po, name) for po, name in result.all()],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/purchase-orders/{po_id}", response_model=PurchaseOrderResponse)
async def get_purchase_order(
    po_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    po, supplier_name = await _get_po_or_404(db, po_id)
    return _to_response(po, supplier_name)


@router.post("/purchase-orders", response_model=PurchaseOrderResponse, status_code=201)
async def create_purchase_order(
    body: PurchaseOrderCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    supplier = await _get_supplier_or_404(db, body.supplier_id)

    # Creating a PO directly in an approved/completed state skips the workflow.
    if body.status in {"approved", "completed"}:
        raise HTTPException(
            status_code=400,
            detail="A purchase order must start as draft or pending and be approved explicitly",
        )

    try:
        po = await create_with_unique_number(
            db,
            user_id=current_user.id,
            po_number=body.po_number,
            supplier_id=supplier.id,
            description=body.description,
            amount=body.amount,
            status=body.status,
            notes=body.notes,
        )
    except IntegrityError:
        raise HTTPException(status_code=409, detail="PO number already exists")

    logger.info(
        f"Created {po.po_number} for {supplier.name} "
        f"(Rp {po.amount:,.0f}, {po.approval_level})"
    )
    await record_audit(
        db,
        user=current_user,
        action="purchase_order.created",
        entity_type="purchase_order",
        entity_id=po.id,
        detail={
            "po_number": po.po_number,
            "supplier_id": po.supplier_id,
            "amount": po.amount,
            "status": po.status,
            "approval_level": po.approval_level,
        },
        request=request,
    )
    return _to_response(po, supplier.name)


@router.patch("/purchase-orders/{po_id}", response_model=PurchaseOrderResponse)
async def update_purchase_order(
    po_id: int,
    body: PurchaseOrderUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    po, supplier_name = await _get_po_or_404(db, po_id)
    changes = body.model_dump(exclude_unset=True)
    previous_status = po.status

    if not changes:
        return _to_response(po, supplier_name)

    if "supplier_id" in changes and changes["supplier_id"] != po.supplier_id:
        supplier = await _get_supplier_or_404(db, changes["supplier_id"])
        po.supplier_id = supplier.id
        supplier_name = supplier.name

    if "status" in changes:
        new_status = changes["status"]
        if not can_transition(po.status, new_status):
            raise HTTPException(
                status_code=409,
                detail=f"Cannot move a purchase order from '{po.status}' to '{new_status}'",
            )
        po.status = new_status

    if "amount" in changes and changes["amount"] is not None:
        new_amount = float(changes["amount"])
        if po.amount and new_amount != po.amount:
            delta_ratio = abs(new_amount - po.amount) / po.amount
            # Significant edits to an approved PO must go back for approval.
            if (
                delta_ratio > AMENDMENT_REAPPROVAL_RATIO
                and po.status in {"approved", "completed"}
            ):
                po.status = "pending"
                logger.info(
                    f"{po.po_number} amendment {delta_ratio:.0%} exceeds "
                    f"{AMENDMENT_REAPPROVAL_RATIO:.0%}; reset to pending"
                )
        po.amount = new_amount
        po.approval_level = approval_level_for(new_amount)

    for field in ("description", "notes"):
        if field in changes:
            setattr(po, field, changes[field])

    await db.flush()
    await db.refresh(po)
    await record_audit(
        db,
        user=current_user,
        action="purchase_order.updated",
        entity_type="purchase_order",
        entity_id=po.id,
        detail={
            "po_number": po.po_number,
            "fields": sorted(changes.keys()),
            "status_before": previous_status,
            "status_after": po.status,
            "amount_after": po.amount,
        },
        request=request,
    )
    return _to_response(po, supplier_name)


@router.delete("/purchase-orders/{po_id}", status_code=204)
async def delete_purchase_order(
    po_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    po, _ = await _get_po_or_404(db, po_id)
    if po.status in {"approved", "completed"}:
        raise HTTPException(
            status_code=409,
            detail="Approved or completed purchase orders cannot be deleted; cancel them instead",
        )
    po_number = po.po_number
    await db.delete(po)
    await db.flush()
    await record_audit(
        db,
        user=current_user,
        action="purchase_order.deleted",
        entity_type="purchase_order",
        entity_id=po_id,
        detail={"po_number": po_number},
        request=request,
    )
    logger.info(f"Deleted purchase order {po_number}")
