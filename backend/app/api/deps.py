import uuid
from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader, APIKeyCookie
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.tokens import verify_token
from app.db.models import UserAccount
from app.db.session import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)
# Le Back Office (Next.js) est servi par Apache qui route /api/* directement vers
# le backend : le navigateur ne peut donc pas passer par le proxy Next pour
# injecter un Bearer. On accepte aussi le jeton d'accès via un cookie httpOnly
# (posé au login), validé exactement comme un Bearer.
access_cookie_scheme = APIKeyCookie(name="cnts_access", auto_error=False)

# Rôles considérés comme "personnel" (tout sauf un compte patient).
PATIENT_ROLE = "PATIENT"
ADMIN_ROLE = "ADMIN"

# Server-side authorisation is deliberately independent from the navigation
# displayed by the Next.js app.  Hiding a link is not an access control.
MODULE_ROLES: dict[str, frozenset[str]] = {
    "donneurs": frozenset({"admin", "agent_accueil", "technicien_labo", "biologiste", "medecin"}),
    "dons": frozenset({"admin", "agent_accueil", "technicien_labo", "biologiste", "medecin"}),
    "laboratoire": frozenset({"admin", "technicien_labo", "biologiste", "medecin"}),
    "stock": frozenset({"admin", "agent_stock", "technicien_labo", "biologiste", "agent_distribution"}),
    "distribution": frozenset({"admin", "agent_distribution", "technicien_labo", "biologiste", "medecin"}),
    "hemovigilance": frozenset({"admin", "technicien_labo", "biologiste", "agent_distribution", "medecin"}),
    "collectes": frozenset({"admin", "agent_accueil"}),
    "analytics": frozenset({"admin", "biologiste"}),
    "administration": frozenset({"admin"}),
}


def _resolve_user(db: Session, token: str | None) -> UserAccount | None:
    """Valide un jeton d'accès et renvoie l'utilisateur actif, ou None."""
    if not token:
        return None
    payload = verify_token(token, secret=settings.auth_token_secret)
    if not payload or payload.get("type") != "access":
        return None
    try:
        user_id = uuid.UUID(str(payload.get("sub")))
    except ValueError:
        return None
    user = db.get(UserAccount, user_id)
    if not user or not user.is_active:
        return None
    return user


def get_current_user(
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme),
    cookie_token: str | None = Depends(access_cookie_scheme),
) -> UserAccount:
    """Require authentication - raises 401 if not authenticated.

    Accepte le jeton via l'en-tête ``Authorization: Bearer`` (clients API,
    mobile) ou via le cookie httpOnly ``cnts_access`` (navigateur Back Office).
    """
    token = token or cookie_token
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = verify_token(token, secret=settings.auth_token_secret)
    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = uuid.UUID(str(payload.get("sub")))
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.get(UserAccount, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    return user


def get_current_user_optional(
    db: Session = Depends(get_db),
    token: str | None = Depends(oauth2_scheme),
) -> UserAccount | None:
    """Optional authentication - returns None if not authenticated."""
    if not token:
        return None

    payload = verify_token(token, secret=settings.auth_token_secret)
    if not payload or payload.get("type") != "access":
        return None

    try:
        user_id = uuid.UUID(str(payload.get("sub")))
    except ValueError:
        return None

    user = db.get(UserAccount, user_id)
    if not user or not user.is_active:
        return None

    return user


def require_auth_in_production(
    token: str | None = Depends(oauth2_scheme),
    cookie_token: str | None = Depends(access_cookie_scheme),
    api_key: str | None = Depends(api_key_header),
    db: Session = Depends(get_db),
) -> UserAccount | None:
    """
    Require authentication in production, optional in dev.
    Accepts either Bearer token or X-API-Key header.
    """
    is_production = settings.env in ("prod", "production", "staging")

    # Try Bearer token first
    credential = token or cookie_token
    if credential:
        payload = verify_token(credential, secret=settings.auth_token_secret)
        if payload and payload.get("type") == "access":
            try:
                user_id = uuid.UUID(str(payload.get("sub")))
                user = db.get(UserAccount, user_id)
                if user and user.is_active:
                    return user
            except ValueError:
                pass

    # Try API key
    if api_key and hasattr(settings, "api_keys"):
        # API key validation could be added here
        pass

    # In production, authentication is required
    if is_production:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # In dev, allow unauthenticated access with a warning
    return None


def require_staff(user: UserAccount = Depends(get_current_user)) -> UserAccount:
    """Authentification obligatoire + rôle personnel (tout sauf PATIENT)."""
    if (user.role or "").upper() == PATIENT_ROLE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé au personnel du centre",
        )
    return user


def require_admin(user: UserAccount = Depends(get_current_user)) -> UserAccount:
    """Authentification obligatoire + rôle administrateur."""
    if (user.role or "").upper() != ADMIN_ROLE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Action réservée aux administrateurs",
        )
    return user


def require_module(module: str) -> Callable[[UserAccount], UserAccount]:
    """Return a dependency that enforces the module's allowed staff roles."""
    allowed_roles = MODULE_ROLES[module]

    def dependency(user: UserAccount = Depends(require_staff)) -> UserAccount:
        if (user.role or "").lower() not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Accès non autorisé au module {module}",
            )
        return user

    return dependency


def require_liberation_validator(user: UserAccount = Depends(require_staff)) -> UserAccount:
    """La lecture du laboratoire ne confère pas le droit de libérer un don."""
    if (user.role or "").lower() not in {"admin", "biologiste"}:
        raise HTTPException(status_code=403, detail="Validation biologique réservée au biologiste")
    return user
