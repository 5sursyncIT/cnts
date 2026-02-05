import uuid
from typing import Generator

from fastapi import Depends, HTTPException, Header, status
from fastapi.security import OAuth2PasswordBearer, APIKeyHeader
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.tokens import verify_token
from app.db.models import UserAccount
from app.db.session import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login", auto_error=False)
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
) -> UserAccount:
    """Require authentication - raises 401 if not authenticated."""
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
    api_key: str | None = Depends(api_key_header),
    db: Session = Depends(get_db),
) -> UserAccount | None:
    """
    Require authentication in production, optional in dev.
    Accepts either Bearer token or X-API-Key header.
    """
    is_production = settings.env in ("prod", "production", "staging")

    # Try Bearer token first
    if token:
        payload = verify_token(token, secret=settings.auth_token_secret)
        if payload and payload.get("type") == "access":
            try:
                user_id = uuid.UUID(str(payload.get("sub")))
                user = db.get(UserAccount, user_id)
                if user and user.is_active:
                    return user
            except ValueError:
                pass

    # Try API key
    if api_key and hasattr(settings, 'api_keys'):
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
