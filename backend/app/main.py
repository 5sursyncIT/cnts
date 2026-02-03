import json
import logging
import time
import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.api.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.core.metrics import metrics
from app.core.request_context import request_id_var


def create_app() -> FastAPI:
    configure_logging(settings.log_level)
    logger = logging.getLogger("app.http")

    application = FastAPI(
        title=settings.api_title,
        version=settings.api_version,
    )

    if settings.cors_origins:
        application.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    class ObservabilityMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next):
            rid = request.headers.get("x-request-id") or str(uuid.uuid4())
            token = request_id_var.set(rid)
            start = time.perf_counter()
            status_code = 500
            route = request.scope.get("route")
            route_path = getattr(route, "path", None) or request.url.path
            try:
                response: Response = await call_next(request)
                status_code = response.status_code
                response.headers["X-Request-Id"] = rid
                return response
            finally:
                duration_ms = (time.perf_counter() - start) * 1000.0
                metrics.inc(
                    "cnts_http_requests_total",
                    labels={
                        "method": request.method,
                        "route": route_path,
                        "status": str(status_code),
                    },
                )
                metrics.observe_ms(
                    "cnts_http_request_duration_ms",
                    value_ms=duration_ms,
                    labels={"method": request.method, "route": route_path},
                )
                logger.info(
                    json.dumps(
                        {
                            "event": "http.request",
                            "method": request.method,
                            "path": request.url.path,
                            "route": route_path,
                            "status": status_code,
                            "duration_ms": round(duration_ms, 2),
                        }
                    )
                )
                request_id_var.reset(token)

    application.add_middleware(ObservabilityMiddleware)
    application.include_router(api_router)
    return application


app = create_app()
