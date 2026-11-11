from sqlalchemy import String, Float, Integer, UniqueConstraint
from sqlalchemy.orm import mapped_column, Mapped
from app.database.postgres import Base
from app.models.base import TimestampMixin


class Budget(Base, TimestampMixin):
    __tablename__ = "budgets"
    __table_args__ = (
        UniqueConstraint("department", "fiscal_year", name="uq_budget_department_year"),
    )

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    department: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    fiscal_year: Mapped[int] = mapped_column(Integer, nullable=False)
    total_budget: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    allocated: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    remaining: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    def __repr__(self):
        return f"<Budget {self.department} {self.fiscal_year}>"
