"""
Seed demo data into the database.

The script is idempotent: running it twice will not create duplicates and will
not violate the (department, fiscal_year) budget constraint.

Run: python seed.py
"""
import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import select  # noqa: E402

from app.database.postgres import init_db, async_session_factory, close_db  # noqa: E402
from app.models.budget import Budget  # noqa: E402
from app.models.purchase_order import PurchaseOrder  # noqa: E402
from app.models.supplier import Supplier  # noqa: E402
from app.models.user import User  # noqa: E402

# Direct import to avoid circular dependency
from passlib.context import CryptContext  # noqa: E402

_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")


def _hash_password(password: str) -> str:
    return _pwd.hash(password)


from app.services.purchase_order_service import approval_level_for  # noqa: E402
from app.utils.logger import get_logger  # noqa: E402

logger = get_logger(__name__)


async def _get_or_create_user(db, **fields) -> User:
    result = await db.execute(select(User).where(User.username == fields["username"]))
    user = result.scalar_one_or_none()
    if user is None:
        user = User(**fields)
        db.add(user)
        await db.flush()
        logger.info(f"Created user: {fields['username']}")
    return user


async def _get_or_create_supplier(db, name: str, **fields) -> Supplier:
    result = await db.execute(select(Supplier).where(Supplier.name == name))
    supplier = result.scalar_one_or_none()
    if supplier is None:
        supplier = Supplier(name=name, **fields)
        db.add(supplier)
        await db.flush()
    return supplier


async def _get_or_create_budget(db, department: str, fiscal_year: int, **fields) -> Budget:
    result = await db.execute(
        select(Budget).where(
            Budget.department == department, Budget.fiscal_year == fiscal_year
        )
    )
    budget = result.scalar_one_or_none()
    if budget is None:
        total = fields.get("total_budget", 0.0)
        allocated = fields.get("allocated", 0.0)
        budget = Budget(
            department=department,
            fiscal_year=fiscal_year,
            total_budget=total,
            allocated=allocated,
            remaining=round(total - allocated, 2),
        )
        db.add(budget)
        await db.flush()
    return budget


async def seed():
    await init_db()

    async with async_session_factory() as db:
        admin = await _get_or_create_user(
            db,
            username="admin",
            email="admin@smartprocure.ai",
            hashed_password=_hash_password("admin123"),
            full_name="Restu",
            role="admin",
            is_active=True,
        )
        await _get_or_create_user(
            db,
            username="viewer",
            email="viewer@smartprocure.ai",
            hashed_password=_hash_password("viewer123"),
            full_name="Procurement Viewer",
            role="viewer",
            is_active=True,
        )

        suppliers = {
            "PT Sukses Makmur Sentosa": dict(
                category="Raw Materials",
                status="active",
                risk_level="low",
                delivery_score=95.0,
                quality_score=90.0,
                evaluation_notes="Best Supplier 2025",
            ),
            "PT Logistik Nusantara": dict(
                category="Logistics",
                status="active",
                risk_level="high",
                delivery_score=70.0,
                quality_score=75.0,
                evaluation_notes="High Risk Supplier",
            ),
            "PT Maju Jaya Abadi": dict(
                category="Equipment",
                status="active",
                risk_level="medium",
                delivery_score=82.0,
                quality_score=78.0,
            ),
            "CV Berkah Sejahtera": dict(
                category="Services",
                status="inactive",
                risk_level="low",
                delivery_score=88.0,
                quality_score=85.0,
            ),
            "PT Karya Mandiri Perkasa": dict(
                category="Raw Materials",
                status="active",
                risk_level="low",
                delivery_score=92.0,
                quality_score=94.0,
            ),
        }
        supplier_objects = {}
        for name, fields in suppliers.items():
            supplier_objects[name] = await _get_or_create_supplier(db, name, **fields)

        budgets = [
            ("IT Infrastructure", 25_000_000_000, 18_500_000_000),
            ("Raw Materials", 45_000_000_000, 42_000_000_000),
            ("Logistics", 20_000_000_000, 15_000_000_000),
            ("Office Equipment", 10_000_000_000, 3_500_000_000),
            ("Consulting Services", 15_000_000_000, 12_000_000_000),
        ]
        for department, total, allocated in budgets:
            await _get_or_create_budget(
                db,
                department,
                fiscal_year=2025,
                total_budget=total,
                allocated=allocated,
            )

        # Demo purchase orders, only when the table is still empty.
        existing_pos = (
            await db.execute(select(PurchaseOrder).limit(1))
        ).scalar_one_or_none()
        if existing_pos is None:
            year = datetime.now(timezone.utc).year
            demo_pos = [
                ("PT Sukses Makmur Sentosa", 320_000_000, "approved", "Raw material Q1"),
                ("PT Logistik Nusantara", 45_000_000, "pending", "Freight services"),
                ("PT Maju Jaya Abadi", 12_000_000, "draft", "Office equipment"),
            ]
            for index, (supplier_name, amount, status, description) in enumerate(
                demo_pos, start=1
            ):
                db.add(
                    PurchaseOrder(
                        po_number=f"PO-{year}-{index:04d}",
                        supplier_id=supplier_objects[supplier_name].id,
                        user_id=admin.id,
                        description=description,
                        amount=amount,
                        status=status,
                        approval_level=approval_level_for(amount),
                    )
                )

        await db.commit()
        logger.info("Demo data seeded successfully!")

    await close_db()


if __name__ == "__main__":
    asyncio.run(seed())
