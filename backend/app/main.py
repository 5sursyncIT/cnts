import json
import logging
import time
import uuid

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from app.api.router import api_router
from app.core.config import settings
from app.core.logging import configure_logging
from app.core.metrics import metrics
from app.core.rate_limit import RateLimitMiddleware
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
            # Restrict to only necessary HTTP methods (not "*")
            allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            # Restrict to only necessary headers
            allow_headers=[
                "Accept",
                "Accept-Language",
                "Content-Type",
                "Authorization",
                "X-Request-ID",
                "X-Admin-Token",
                "X-Admin-Email",
            ],
            # Expose headers to the client
            expose_headers=["X-Request-Id", "X-Total-Count"],
            # Cache preflight requests for 1 hour
            max_age=3600,
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
                # Distributed Tracing Simulation (Log context)
                # In a real setup, we would start an OpenTelemetry span here
                response: Response = await call_next(request)
                status_code = response.status_code
                response.headers["X-Request-Id"] = rid

                # Security headers
                response.headers["X-Content-Type-Options"] = "nosniff"
                response.headers["X-Frame-Options"] = "DENY"
                response.headers["X-XSS-Protection"] = "1; mode=block"
                response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

                # Trace Context Propagation (W3C Trace Context)
                # Simulating traceparent injection if not present
                if "traceparent" not in request.headers:
                    # version-traceid-parentid-flags
                    trace_id = rid.replace("-", "")
                    parent_id = uuid.uuid4().hex[:16]
                    response.headers["traceparent"] = f"00-{trace_id}-{parent_id}-01"

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
    application.add_middleware(RateLimitMiddleware)
    application.mount("/static", StaticFiles(directory="static"), name="static")
    application.include_router(api_router, prefix="/api")
    return application


app = create_app()
