"""Protection CSRF des écritures authentifiées par le cookie ``cnts_access``.

Le Back Office appelle l'API depuis le navigateur avec ce cookie httpOnly. Une
requête modifiante qui s'appuie sur lui (pas d'en-tête Authorization) doit donc
venir d'une origine de confiance. Les clients à jeton Bearer (portail côté
serveur, mobile) ne sont pas concernés : un site tiers ne peut pas forger cet
en-tête.
"""

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response

from app.core.config import settings

UNSAFE_METHODS = {"POST", "PUT", "PATCH", "DELETE"}
ACCESS_COOKIE = "cnts_access"


def is_csrf_violation(request: Request) -> bool:
    if request.method not in UNSAFE_METHODS:
        return False
    if request.headers.get("authorization") or ACCESS_COOKIE not in request.cookies:
        return False
    origin = request.headers.get("origin")
    if origin is None:
        return False  # client non navigateur ; SameSite=Lax couvre le reste
    return origin not in settings.trusted_origins


class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        if is_csrf_violation(request):
            return JSONResponse(status_code=403, content={"detail": "Origine de la requête refusée"})
        return await call_next(request)
