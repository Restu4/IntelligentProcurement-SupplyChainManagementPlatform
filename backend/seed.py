"""
Seed demo data into the database.
Run: python seed.py
"""
import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from app.database.postgres import init_db, async_session_factory, close_db
from app.models.user import User
from app.models.supplier import Supplier
from app.models.budget import Budget

# Direct import to avoid circular dependency
from passlib.context import CryptContext
_pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
def _hash_password(password: str) -> str:
    return _pwd.hash(password)

from app.utils.logger import get_logger

logger = get_logger(__name__)


async def seed():
    await init_db()

    async with async_session_factory() as db:
        # 1. Create admin user
        admin = User(
            username="admin",
            email="admin@smartprocure.ai",
            hashed_password=_hash_password("admin123"),
            full_name="Restu",
            role="admin",
            is_active=True,
        )
        db.add(admin)

        viewer = User(
            username="viewer",
            email="viewer@smartprocure.ai",
            hashed_password=_hash_password("viewer123"),
            full_name="Procurement Viewer",
            role="viewer",
            is_active=True,
        )
        db.add(viewer)

        # 2. Create suppliers
        suppliers = [
            Supplier(name="PT Sukses Makmur Sentosa", category="Raw Materials", status="active", risk_level="low",
                     delivery_score=95.0, quality_score=90.0, evaluation_notes="Best Supplier 2025"),
            Supplier(name="PT Logistik Nusantara", category="Logistics", status="active", risk_level="high",
                     delivery_score=70.0, quality_score=75.0, evaluation_notes="High Risk Supplier"),
            Supplier(name="PT Maju Jaya Abadi", category="Equipment", status="active", risk_level="medium",
                     delivery_score=82.0, quality_score=78.0),
            Supplier(name="CV Berkah Sejahtera", category="Services", status="inactive", risk_level="low",
                     delivery_score=88.0, quality_score=85.0),
            Supplier(name="PT Karya Mandiri Perkasa", category="Raw Materials", status="active", risk_level="low",
                     delivery_score=92.0, quality_score=94.0),
        ]
        for s in suppliers:
            db.add(s)

        # 3. Create budgets
        budgets = [
            Budget(department="IT Infrastructure", fiscal_year=2025, total_budget=25_000_000_000, allocated=18_500_000_000, remaining=6_500_000_000),
            Budget(department="Raw Materials", fiscal_year=2025, total_budget=45_000_000_000, allocated=42_000_000_000, remaining=3_000_000_000),
            Budget(department="Logistics", fiscal_year=2025, total_budget=20_000_000_000, allocated=15_000_000_000, remaining=5_000_000_000),
            Budget(department="Office Equipment", fiscal_year=2025, total_budget=10_000_000_000, allocated=3_500_000_000, remaining=6_500_000_000),
            Budget(department="Consulting Services", fiscal_year=2025, total_budget=15_000_000_000, allocated=12_000_000_000, remaining=3_000_000_000),
        ]
        for b in budgets:
            db.add(b)

        await db.commit()
        logger.info("Demo data seeded successfully!")

    await close_db()


if __name__ == "__main__":
    asyncio.run(seed())
