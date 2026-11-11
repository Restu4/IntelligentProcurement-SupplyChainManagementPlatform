"""Purchase-order domain rules.

The approval bands mirror `data/02_PRC-POG-002_PO_Guidelines.md`
("Thresholds" table) so the application behaves like the documented policy.
"""

from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.purchase_order import PurchaseOrder

# (upper bound exclusive, approval level)
APPROVAL_BANDS: tuple[tuple[float, str], ...] = (
    (25_000_000, "Procurement Manager"),
    (150_000_000, "Senior Procurement Manager"),
    (750_000_000, "Procurement Director"),
)
TOP_APPROVAL_LEVEL = "CFO + Procurement Director"

# Allowed status transitions. Terminal states cannot move.
STATUS_TRANSITIONS: dict[str, set[str]] = {
    "draft": {"pending", "cancelled"},
    "pending": {"approved", "rejected", "cancelled"},
    "approved": {"completed", "cancelled"},
    "rejected": {"draft"},
    "completed": set(),
    "cancelled": set(),
}

# Anything above this relative change needs re-approval (PRC-POG-002 §4).
AMENDMENT_REAPPROVAL_RATIO = 0.10


def approval_level_for(amount: float) -> str:
    for upper_bound, level in APPROVAL_BANDS:
        if amount <= upper_bound:
            return level
    return TOP_APPROVAL_LEVEL


def can_transition(current: str, new: str) -> bool:
    if current == new:
        return True
    return new in STATUS_TRANSITIONS.get(current, set())


def _current_year() -> int:
    return datetime.now(timezone.utc).year


async def next_po_number(db: AsyncSession) -> str:
    """Return the next PO-<year>-<sequence> number.

    Zero-padded four-digit sequences keep lexicographic ordering identical to
    numeric ordering, so a single ORDER BY DESC query is enough.
    """
    year = _current_year()
    prefix = f"PO-{year}-"
    result = await db.execute(
        select(PurchaseOrder.po_number)
        .where(PurchaseOrder.po_number.like(f"{prefix}%"))
        .order_by(PurchaseOrder.po_number.desc())
        .limit(1)
    )
    last = result.scalar_one_or_none()

    sequence = 1
    if last:
        try:
            sequence = int(last.rsplit("-", 1)[1]) + 1
        except (IndexError, ValueError):
            sequence = 1
    return f"{prefix}{sequence:04d}"


async def create_with_unique_number(
    db: AsyncSession,
    *,
    user_id: int,
    po_number: str | None,
    supplier_id: int,
    description: str | None,
    amount: float,
    status: str,
    notes: str | None,
) -> PurchaseOrder:
    """Insert a PO, retrying number generation on a rare uniqueness race."""
    attempts = 3 if po_number is None else 1

    for attempt in range(attempts):
        candidate = po_number or await next_po_number(db)
        po = PurchaseOrder(
            po_number=candidate,
            supplier_id=supplier_id,
            user_id=user_id,
            description=description,
            amount=amount,
            status=status,
            approval_level=approval_level_for(amount),
            notes=notes,
        )
        db.add(po)
        try:
            await db.flush()
        except IntegrityError:
            await db.rollback()
            if po_number is not None:
                raise
            if attempt == attempts - 1:
                raise
            continue
        await db.refresh(po)
        return po

    raise RuntimeError("Could not allocate a unique PO number")
