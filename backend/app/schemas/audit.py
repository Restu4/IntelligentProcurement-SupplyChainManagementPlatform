from pydantic import BaseModel

from app.schemas.common import UtcDatetime


class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None
    username: str | None
    action: str
    entity_type: str | None
    entity_id: str | None
    detail: str | None
    ip_address: str | None
    created_at: UtcDatetime

    class Config:
        from_attributes = True
