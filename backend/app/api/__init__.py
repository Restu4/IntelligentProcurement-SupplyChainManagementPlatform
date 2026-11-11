from app.api.analytics import router as analytics_router
from app.api.audit import router as audit_router
from app.api.auth import router as auth_router
from app.api.budgets import router as budgets_router
from app.api.chat import router as chat_router
from app.api.documents import router as documents_router
from app.api.purchase_orders import router as purchase_orders_router
from app.api.suppliers import router as suppliers_router
from app.api.forecast import router as forecast_router
from app.api.health import router as health_router

routers = [
    auth_router,
    chat_router,
    documents_router,
    suppliers_router,
    purchase_orders_router,
    budgets_router,
    forecast_router,
    analytics_router,
    audit_router,
    health_router,
]

__all__ = ["routers"]
