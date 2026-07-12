from app.api.auth import router as auth_router
from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.suppliers import router as suppliers_router
from app.api.forecast import router as forecast_router
from app.api.health import router as health_router

routers = [
    auth_router,
    chat_router,
    documents_router,
    suppliers_router,
    forecast_router,
    health_router,
]

__all__ = ["routers"]
