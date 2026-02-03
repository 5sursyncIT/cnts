from fastapi import APIRouter

from app.api.routes.analyses import router as analyses_router
from app.api.routes.auth import router as auth_router
from app.api.routes.admin_auth import router as admin_auth_router
from app.api.routes.commandes import router as commandes_router
from app.api.routes.crossmatch import router as crossmatch_router
from app.api.routes.donneurs import router as donneurs_router
from app.api.routes.dons import router as dons_router
from app.api.routes.health import router as health_router
from app.api.routes.hemovigilance import router as hemovigilance_router
from app.api.routes.hopitaux import router as hopitaux_router
from app.api.routes.liberation import router as liberation_router
from app.api.routes.metrics import router as metrics_router
from app.api.routes.poches import router as poches_router
from app.api.routes.receveurs import router as receveurs_router
from app.api.routes.sync import router as sync_router
from app.api.routes.stock import router as stock_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.trace import router as trace_router


api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(admin_auth_router, tags=["admin-auth"])
api_router.include_router(donneurs_router, tags=["donneurs"])
api_router.include_router(dons_router, tags=["dons"])
api_router.include_router(analyses_router, tags=["analyses"])
api_router.include_router(liberation_router, tags=["liberation"])
api_router.include_router(poches_router, tags=["poches"])
api_router.include_router(stock_router, tags=["stock"])
api_router.include_router(hopitaux_router, tags=["hopitaux"])
api_router.include_router(commandes_router, tags=["commandes"])
api_router.include_router(receveurs_router, tags=["receveurs"])
api_router.include_router(crossmatch_router, tags=["cross-match"])
api_router.include_router(hemovigilance_router, tags=["hemovigilance"])
api_router.include_router(analytics_router, tags=["analytics"])
api_router.include_router(trace_router, tags=["trace"])
api_router.include_router(metrics_router, tags=["metrics"])
api_router.include_router(sync_router, tags=["sync"])
