from sqlalchemy import String, Float, Text, ForeignKey, Integer
from sqlalchemy.orm import mapped_column, Mapped
from app.database.postgres import Base
from app.models.base import TimestampMixin


class ForecastHistory(Base, TimestampMixin):
    __tablename__ = "forecast_history"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    supplier_id: Mapped[int] = mapped_column(Integer, ForeignKey("suppliers.id"), nullable=True)
    forecast_type: Mapped[str] = mapped_column(String(100), nullable=False)
    parameters: Mapped[str] = mapped_column(Text, nullable=True)
    result: Mapped[str] = mapped_column(Text, nullable=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=True)

    def __repr__(self):
        return f"<Forecast {self.forecast_type}>"
