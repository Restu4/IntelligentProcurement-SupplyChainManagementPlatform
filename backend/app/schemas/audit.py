from datetime import datetime

from pydantic import BaseModel


class AuditLogResponse(BaseModel):
    id: int
    user_id: int | None
    username: str | None
    action: str
    entity_type: str | None
    entity_id: str | None
    detail: str | None
    ip_address: str | None
    created_at: datetime

    class Config:
        from_attributes = True
