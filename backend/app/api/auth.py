import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.config.settings import settings
from app.database.postgres import get_db
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
)
from app.utils.audit import record_audit, record_audit_standalone
from app.utils.auth import (
    create_access_token,
    get_current_user,
    hash_password,
    hash_refresh_token,
    new_refresh_token,
    refresh_token_expiry,
    verify_password,
)
from app.utils.rate_limit import login_rate_limit

router = APIRouter(prefix="/api", tags=["Authentication"])


def _expires_in() -> int:
    return settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60


def _as_utc(value: datetime | None) -> datetime | None:
    """SQLite returns naive datetimes even for timezone-aware columns."""
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _is_expired(value: datetime | None) -> bool:
    aware = _as_utc(value)
    if aware is None:
        return True
    return aware <= datetime.now(timezone.utc)


async def _issue_tokens(
    db: AsyncSession,
    user: User,
    request: Request | None,
) -> TokenResponse:
    access = create_access_token({"sub": str(user.id)})
    raw_refresh = new_refresh_token()

    client_ip = None
    user_agent = None
    if request is not None:
        client_ip = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")

    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(raw_refresh),
            expires_at=refresh_token_expiry(),
            user_agent=(user_agent or "")[:255] or None,
            ip_address=(client_ip or "")[:64] or None,
        )
    )
    await db.flush()

    return TokenResponse(
        access_token=access,
        refresh_token=raw_refresh,
        expires_in=_expires_in(),
    )


async def _revoke_all(db: AsyncSession, user_id: int) -> None:
    await db.execute(
        update(RefreshToken)
        .where(
            RefreshToken.user_id == user_id,
            RefreshToken.revoked_at.is_(None),
        )
        .values(revoked_at=datetime.now(timezone.utc))
    )


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(login_rate_limit)])
async def login(
    body: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()

    # bcrypt is CPU-bound; keep the event loop free.
    password_ok = False
    if user is not None:
        password_ok = await asyncio.to_thread(
            verify_password, body.password, user.hashed_password
        )

    if not user or not password_ok:
        await record_audit_standalone(
            username=body.username,
            action="login_failed",
            entity_type="auth",
            detail={"reason": "invalid_credentials"},
            request=request,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    if not user.is_active:
        await record_audit_standalone(
            user=user,
            action="login_failed",
            entity_type="auth",
            detail={"reason": "inactive_account"},
            request=request,
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    tokens = await _issue_tokens(db, user, request)
    await record_audit(
        db,
        user=user,
        action="login",
        entity_type="auth",
        entity_id=user.id,
        request=request,
    )
    return tokens


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    body: RefreshRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    token_hash = hash_refresh_token(body.refresh_token)
    result = await db.execute(
        select(RefreshToken).where(RefreshToken.token_hash == token_hash)
    )
    stored = result.scalar_one_or_none()

    if stored is None:
        await record_audit_standalone(
            action="refresh_failed",
            entity_type="auth",
            detail={"reason": "unknown_token"},
            request=request,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if stored.revoked_at is not None:
        # Token reuse: assume theft and invalidate the whole family. Commit
        # explicitly because the 401 below would otherwise roll the change back.
        await _revoke_all(db, stored.user_id)
        await db.commit()
        await record_audit_standalone(
            username=f"user:{stored.user_id}",
            action="refresh_reuse_detected",
            entity_type="auth",
            entity_id=stored.user_id,
            detail={"reason": "revoked_token_reused"},
            request=request,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked",
        )

    if _is_expired(stored.expires_at):
        stored.revoked_at = datetime.now(timezone.utc)
        await db.flush()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )

    user = await db.get(User, stored.user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is no longer active",
        )

    # Rotate: the old token can never be used again.
    stored.revoked_at = datetime.now(timezone.utc)
    tokens = await _issue_tokens(db, user, request)
    await db.flush()
    return tokens


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    body: LogoutRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    if body.refresh_token:
        token_hash = hash_refresh_token(body.refresh_token)
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        stored = result.scalar_one_or_none()
        if stored is not None and stored.revoked_at is None:
            stored.revoked_at = datetime.now(timezone.utc)
            await db.flush()
            await record_audit(
                db,
                username=f"user:{stored.user_id}",
                action="logout",
                entity_type="auth",
                entity_id=stored.user_id,
                request=request,
            )
    return None


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    body: UserCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(User).where((User.username == body.username) | (User.email == body.email))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already exists",
        )

    user = User(
        username=body.username,
        email=body.email,
        hashed_password=await asyncio.to_thread(hash_password, body.password),
        full_name=body.full_name,
        # Never trust a client-supplied role. Privilege escalation guard.
        role="viewer",
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    await record_audit(
        db,
        user=user,
        action="register",
        entity_type="user",
        entity_id=user.id,
        request=request,
    )
    return user


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
