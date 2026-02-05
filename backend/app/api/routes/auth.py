import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.passwords import hash_recovery_code, verify_password
from app.core.tokens import sign_token, verify_token
from app.core.totp import verify_totp
from app.db.models import UserAccount, UserRecoveryCode
from app.db.session import get_db
from app.schemas.auth import LoginIn, LoginOut, MfaVerifyIn, MfaVerifyOut


router = APIRouter(prefix="/auth")


@router.post("/login", response_model=LoginOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> LoginOut:
    stmt = select(UserAccount).where(func.lower(UserAccount.email) == payload.email.lower())
    user = db.execute(stmt).scalar_one_or_none()
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="identifiants invalides")

    if user.mfa_enabled and user.mfa_secret:
        challenge = sign_token(
            {"sub": str(user.id), "type": "mfa_challenge"},
            secret=settings.auth_token_secret,
            ttl_seconds=5 * 60,
        )
        return LoginOut(mfa_required=True, challenge_token=challenge)

    access = sign_token(
        {"sub": str(user.id), "type": "access"},
        secret=settings.auth_token_secret,
        ttl_seconds=8 * 60 * 60,
    )
    return LoginOut(mfa_required=False, access_token=access, user=user)


@router.post("/mfa/verify", response_model=MfaVerifyOut)
def mfa_verify(payload: MfaVerifyIn, db: Session = Depends(get_db)) -> MfaVerifyOut:
    token_payload = verify_token(payload.challenge_token, secret=settings.auth_token_secret)
    if not token_payload or token_payload.get("type") != "mfa_challenge":
        raise HTTPException(status_code=401, detail="challenge invalide")

    try:
        user_id = uuid.UUID(str(token_payload.get("sub")))
    except Exception:
        raise HTTPException(status_code=401, detail="challenge invalide")

    user = db.get(UserAccount, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="challenge invalide")

    if not user.mfa_enabled or not user.mfa_secret:
        raise HTTPException(status_code=400, detail="2fa_not_enabled")

    if payload.token:
        if not verify_totp(user.mfa_secret, payload.token, window=1):
            raise HTTPException(status_code=401, detail="code invalide")
    elif payload.recovery_code:
        code_hash = hash_recovery_code(payload.recovery_code, secret=settings.recovery_codes_secret)
        stmt = (
            select(UserRecoveryCode)
            .where(UserRecoveryCode.user_id == user.id)
            .where(UserRecoveryCode.code_hash == code_hash)
            .where(UserRecoveryCode.used_at.is_(None))
        )
        code_row = db.execute(stmt).scalar_one_or_none()
        if code_row is None:
            raise HTTPException(status_code=401, detail="code invalide")
        code_row.used_at = func.now()
    else:
        raise HTTPException(status_code=400, detail="token ou recovery_code requis")

    access = sign_token(
        {"sub": str(user.id), "type": "access"},
        secret=settings.auth_token_secret,
        ttl_seconds=8 * 60 * 60,
    )
    db.commit()
    return MfaVerifyOut(access_token=access)

