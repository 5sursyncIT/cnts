import datetime as dt
import hmac
import uuid

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.audit.events import log_event
from app.core.config import settings
from app.db.models import UserAccount, UserRecoveryCode
from app.db.session import get_db
from app.schemas.auth import AdminDisable2faAllOut, AdminDisable2faIn, AdminDisable2faOut


router = APIRouter(prefix="/admin/auth")


def require_admin(
    x_admin_token: str = Header(..., alias="X-Admin-Token"),
    x_admin_email: str = Header(..., alias="X-Admin-Email"),
) -> str:
    # Use constant-time comparison to prevent timing attacks
    if not hmac.compare_digest(x_admin_token.encode(), settings.admin_token.encode()):
        raise HTTPException(status_code=403, detail="admin_forbidden")
    return x_admin_email


def _disable_user_2fa(db: Session, *, user: UserAccount, admin_email: str, reason: str | None) -> int:
    stmt_count = select(UserRecoveryCode).where(UserRecoveryCode.user_id == user.id)
    recovery_codes = list(db.execute(stmt_count).scalars())
    revoked_count = len(recovery_codes)
    if revoked_count:
        db.execute(delete(UserRecoveryCode).where(UserRecoveryCode.user_id == user.id))

    previous = {"mfa_enabled": bool(user.mfa_enabled), "mfa_secret_present": bool(user.mfa_secret)}
    user.mfa_enabled = False
    user.mfa_secret = None
    user.mfa_disabled_at = dt.datetime.now(dt.timezone.utc)

    log_event(
        db,
        aggregate_type="user",
        aggregate_id=user.id,
        event_type="auth.2fa_disabled",
        payload={
            "admin_email": admin_email,
            "reason": reason,
            "recovery_codes_revoked": revoked_count,
            **previous,
        },
    )
    return revoked_count


@router.post("/2fa/disable/{user_id}", response_model=AdminDisable2faOut)
def disable_2fa_for_user(
    user_id: uuid.UUID,
    body: AdminDisable2faIn,
    admin_email: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminDisable2faOut:
    user = db.get(UserAccount, user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="user_not_found")

    revoked = _disable_user_2fa(db, user=user, admin_email=admin_email, reason=body.reason)
    disabled_at = user.mfa_disabled_at or dt.datetime.now(dt.timezone.utc)
    db.commit()
    return AdminDisable2faOut(user_id=user.id, disabled_at=disabled_at, recovery_codes_revoked=revoked)


@router.post("/2fa/disable-all", response_model=AdminDisable2faAllOut)
def disable_2fa_for_all_users(
    body: AdminDisable2faIn,
    admin_email: str = Depends(require_admin),
    db: Session = Depends(get_db),
) -> AdminDisable2faAllOut:
    stmt = select(UserAccount).where((UserAccount.mfa_enabled.is_(True)) | (UserAccount.mfa_secret.is_not(None)))
    users = list(db.execute(stmt).scalars())

    disabled_ids: list[uuid.UUID] = []
    total_revoked = 0
    for user in users:
        total_revoked += _disable_user_2fa(db, user=user, admin_email=admin_email, reason=body.reason)
        disabled_ids.append(user.id)

    log_event(
        db,
        aggregate_type="system",
        aggregate_id=uuid.UUID(int=0),
        event_type="auth.2fa_disabled_bulk",
        payload={
            "admin_email": admin_email,
            "reason": body.reason,
            "disabled_count": len(disabled_ids),
            "recovery_codes_revoked_total": total_revoked,
        },
    )
    db.commit()
    return AdminDisable2faAllOut(disabled_count=len(disabled_ids), disabled_user_ids=disabled_ids)

