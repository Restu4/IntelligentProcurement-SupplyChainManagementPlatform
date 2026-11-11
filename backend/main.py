import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from app.api import routers
from app.config.settings import settings
from app.database.postgres import init_db, close_db
from app.utils.logger import get_logger
from app.utils.rate_limit import client_key, global_limiter

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Starting SmartProcure AI backend ({settings.ENVIRONMENT})...")
    settings.validate_runtime()

    if settings.uses_insecure_jwt_secret:
        logger.warning(
            "JWT_SECRET_KEY is a default/insecure value. "
            "Set a strong secret in .env before deploying."
        )

    try:
        await init_db()
        logger.info("Database tables initialized")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}", exc_info=True)
        raise

    yield
    await close_db()
    logger.info("SmartProcure AI backend shut down")


app = FastAPI(
    title="SmartProcure AI",
    description="Intelligent Procurement & Supply Chain Assistant API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Per-IP sliding window for the API surface.

    Declared before CORSMiddleware so CORS wraps this response too, which lets
    browsers read the 429 body and Retry-After header.
    """
    path = request.url.path
    if (
        settings.RATE_LIMIT_ENABLED
        and path.startswith("/api")
        and path != "/api/health"
    ):
        allowed, retry_after = global_limiter.hit(
            client_key(request),
            settings.RATE_LIMIT_REQUESTS,
            settings.RATE_LIMIT_WINDOW_SECONDS,
        )
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please slow down."},
                headers={"Retry-After": str(max(1, int(retry_after + 0.999)))},
            )
    return await call_next(request)


# A wildcard origin cannot be combined with credentials. The frontend uses
# bearer tokens (not cookies), so credentials are only enabled for explicit
# origins.
_allowed_origins = settings.cors_origins
_allow_all_origins = "*" in _allowed_origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if _allow_all_origins else _allowed_origins,
    allow_credentials=not _allow_all_origins,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    max_age=600,
)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )


for router in routers:
    app.include_router(router)


@app.get("/", tags=["Root"])
async def root():
    return {
        "service": "SmartProcure AI",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health",
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level=settings.LOG_LEVEL.lower(),
    )
