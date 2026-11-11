from datetime import datetime, timezone
from typing import Annotated, Generic, TypeVar

from pydantic import BaseModel, BeforeValidator, PlainSerializer

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """Standard paginated envelope for list endpoints."""

    items: list[T]
    total: int
    limit: int
    offset: int


def _as_utc(value: object) -> object:
    """Treat naive datetimes from SQLite as UTC.

    PostgreSQL returns timezone-aware values, but SQLite drops the offset. Without
    this, clients parse the timestamp as local time and every row looks hours old.
    """
    if isinstance(value, datetime) and value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _serialize_utc(value: datetime) -> str:
    return value.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


#: A datetime that always reaches clients with a UTC designator.
UtcDatetime = Annotated[
    datetime,
    BeforeValidator(_as_utc),
    PlainSerializer(_serialize_utc, return_type=str, when_used="json"),
]
