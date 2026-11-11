import json
from typing import Any

from app.database.postgres import async_session_factory
from app.models.audit_log import AuditLog


def _client_ip(request) -> str | None:
    if request is None:
        return None
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()[:64]
    if request.client and request.client.host:
        return request.client.host[:64]
    return None


def _build_entry(
    *,
    user=None,
    username: str | None,
    action: str,
    entity_type: str | None,
    entity_id: str | int | None,
    detail: dict[str, Any] | None,
    request,
) -> AuditLog:
    entry = AuditLog(
        user_id=getattr(user, "id", None),
        username=username or getattr(user, "username", None),
        action=action,
        entity_type=entity_type,
        entity_id=str(entity_id) if entity_id is not None else None,
        detail=json.dumps(detail, default=str) if detail else None,
        ip_address=_client_ip(request),
    )
    return entry


async def record_audit(
    db,
    *,
    user=None,
    username: str | None = None,
    action: str,
    entity_type: str | None = None,
    entity_id: str | int | None = None,
    detail: dict[str, Any] | None = None,
    request=None,
) -> None:
    """Add an audit row to the request's session (committed with the request)."""
    db.add(
        _build_entry(
            user=user,
            username=username,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            detail=detail,
            request=request,
        )
    )


async def record_audit_standalone(
    *,
    user=None,
    username: str | None = None,
    action: str,
    entity_type: str | None = None,
    entity_id: str | int | None = None,
    detail: dict[str, Any] | None = None,
    request=None,
) -> None:
    """Persist an audit row even though the request will fail (e.g. bad login)."""
    entry = _build_entry(
        user=user,
        username=username,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        detail=detail,
        request=request,
    )
    async with async_session_factory() as session:
        session.add(entry)
        await session.commit()
