from sqlalchemy import String, Float, Text, ForeignKey, Integer
from sqlalchemy.orm import mapped_column, Mapped, relationship
from app.database.postgres import Base
from app.models.base import TimestampMixin


class ChatHistory(Base, TimestampMixin):
    __tablename__ = "chat_history"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=True)
    sources_json: Mapped[str] = mapped_column(Text, nullable=True)

    user = relationship("User", backref="chat_history")

    def __repr__(self):
        return f"<Chat {self.id}>"
