from typing import Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    """Standard paginated envelope for list endpoints."""

    items: list[T]
    total: int
    limit: int
    offset: int
