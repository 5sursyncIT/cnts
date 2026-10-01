import datetime as dt
import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.audit.events import log_event
from app.core.config import settings
from app.core.passwords import hash_password, hash_recovery_code, verify_password
from app.core.security import hash_cni
from app.core.tokens import sign_token, verify_token
from app.core.totp import generate_secret, match_totp_step, provisioning_uri
from app.db.models import Donneur, UserAccount, UserRecoveryCode
from app.db.session import get_db
from app.schemas.auth import (
    LoginIn,
    LoginOut,
    MfaSetupConfirmIn,
    MfaSetupConfirmOut,
    MfaSetupIn,
    MfaSetupOut,
    MfaVerifyIn,
    MfaVerifyOut,
)
from app.schemas.patient import PatientRegisterIn

router = APIRouter(prefix="/auth")


# Verrouillage : après MAX_FAILED_ATTEMPTS échecs (mot de passe ou code), le compte
# est bloqué LOCK_DURATION. Complète la limite par IP du middleware, qui ne protège
# pas contre une attaque répartie sur plusieurs adresses.
MAX_FAILED_ATTEMPTS = 5
LOCK_DURATION = dt.timedelta(minutes=15)
RECOVERY_CODES_COUNT = 8
ACCESS_TTL_SECONDS = 8 * 60 * 60
CHALLENGE_TTL_SECONDS = 5 * 60
PATIENT_ROLE = "PATIENT"


def _now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def _is_locked(user: UserAccount) -> bool:
    locked_until = user.locked_until
    if locked_until is None:
        return False
    if locked_until.tzinfo is None:  # SQLite renvoie des datetimes naïfs
        locked_until = locked_until.replace(tzinfo=dt.timezone.utc)
    return locked_until > _now()


def _ensure_not_locked(user: UserAccount) -> None:
    if _is_locked(user):
        raise HTTPException(
            status_code=429,
            detail="Compte temporairement verrouillé après plusieurs échecs. Réessayez dans 15 minutes.",
        )


def _audit(db: Session, user: UserAccount, event_type: str, **payload) -> None:
    log_event(db, aggregate_type="user", aggregate_id=user.id, event_type=event_type, payload=payload)


def _register_failure(db: Session, user: UserAccount, step: str) -> None:
    user.failed_auth_attempts = (user.failed_auth_attempts or 0) + 1
    _audit(db, user, "auth.failed", step=step, attempts=user.failed_auth_attempts)
    if user.failed_auth_attempts >= MAX_FAILED_ATTEMPTS:
        user.locked_until = _now() + LOCK_DURATION
        user.failed_auth_attempts = 0
        _audit(db, user, "auth.locked", minutes=int(LOCK_DURATION.total_seconds() // 60))
    db.commit()


def _register_success(user: UserAccount) -> None:
    user.failed_auth_attempts = 0
    user.locked_until = None


def _is_staff(user: UserAccount) -> bool:
    return (user.role or "").upper() != PATIENT_ROLE


def _access_token(user: UserAccount) -> str:
    return sign_token(
        {"sub": str(user.id), "type": "access"},
        secret=settings.auth_token_secret,
        ttl_seconds=ACCESS_TTL_SECONDS,
    )


def _challenge(user: UserAccount, kind: str) -> str:
    return sign_token(
        {"sub": str(user.id), "type": kind},
        secret=settings.auth_token_secret,
        ttl_seconds=CHALLENGE_TTL_SECONDS,
    )


def _user_from_challenge(db: Session, challenge_token: str, kind: str) -> UserAccount:
    token_payload = verify_token(challenge_token, secret=settings.auth_token_secret)
    if not token_payload or token_payload.get("type") != kind:
        raise HTTPException(status_code=401, detail="challenge invalide")
    try:
        user_id = uuid.UUID(str(token_payload.get("sub")))
    except Exception:
        raise HTTPException(status_code=401, detail="challenge invalide")
    user = db.get(UserAccount, user_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="challenge invalide")
    return user


def _accept_totp(user: UserAccount, token: str) -> bool:
    """Vérifie le code TOTP et refuse un code déjà utilisé (même pas temporel ou antérieur)."""
    step = match_totp_step(user.mfa_secret or "", token, window=1)
    if step is None or (user.mfa_last_step is not None and step <= user.mfa_last_step):
        return False
    user.mfa_last_step = step
    return True


@router.post("/login", response_model=LoginOut)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> LoginOut:
    stmt = select(UserAccount).where(func.lower(UserAccount.email) == payload.email.lower())
    user = db.execute(stmt).scalar_one_or_none()
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="identifiants invalides")

    _ensure_not_locked(user)
    if not verify_password(payload.password, user.password_hash):
        _register_failure(db, user, "password")
        raise HTTPException(status_code=401, detail="identifiants invalides")

    if user.mfa_enabled and not user.mfa_secret:
        raise HTTPException(status_code=403, detail="mfa_not_configured")

    if user.mfa_enabled:
        return LoginOut(mfa_required=True, challenge_token=_challenge(user, "mfa_challenge"))

    # Personnel sans second facteur : l'accès est refusé tant que la MFA n'est pas
    # enrôlée. Le jeton renvoyé ne sert qu'à l'enrôlement (/auth/mfa/setup).
    if _is_staff(user):
        return LoginOut(
            mfa_required=True,
            mfa_setup_required=True,
            challenge_token=_challenge(user, "mfa_setup"),
        )

    _register_success(user)
    db.commit()
    return LoginOut(mfa_required=False, access_token=_access_token(user), user=user)


# Message unique quand l'identité ne correspond pas : on ne révèle jamais si une CNI
# est connue du CNTS ni laquelle des deux informations est fausse.
IDENTITE_NON_RECONNUE = "Informations non reconnues. Vérifiez votre numéro de CNI et votre date de naissance."


@router.post("/register-patient", status_code=201)
def register_patient(payload: PatientRegisterIn, db: Session = Depends(get_db)) -> dict:
    """
    Crée un compte patient lié à un dossier donneur EXISTANT.

    Le donneur prouve son identité avec son numéro de CNI (comparé au hash stocké)
    et sa date de naissance. Aucun dossier n'est créé ici : un donneur inconnu du
    CNTS ne peut pas ouvrir de compte.
    """
    if len(payload.password) < 8:
        raise HTTPException(status_code=422, detail="Le mot de passe doit contenir au moins 8 caractères")

    donneur = db.execute(
        select(Donneur).where(
            Donneur.cni_hash == hash_cni(payload.cni),
            Donneur.deleted_at.is_(None),
        )
    ).scalar_one_or_none()
    if donneur is None or donneur.date_naissance is None or donneur.date_naissance != payload.date_naissance:
        raise HTTPException(status_code=400, detail=IDENTITE_NON_RECONNUE)

    if donneur.user_id is not None:
        raise HTTPException(
            status_code=409,
            detail="Un compte existe déjà pour ce dossier donneur. Connectez-vous ou contactez le CNTS.",
        )

    email = payload.email.lower()
    if db.execute(select(UserAccount).where(func.lower(UserAccount.email) == email)).scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Cette adresse email est déjà utilisée.")

    user = UserAccount(email=email, password_hash=hash_password(payload.password), role="PATIENT")
    db.add(user)
    db.flush()
    donneur.user_id = user.id
    db.commit()
    return {"ok": True}


@router.post("/mfa/verify", response_model=MfaVerifyOut)
def mfa_verify(payload: MfaVerifyIn, db: Session = Depends(get_db)) -> MfaVerifyOut:
    user = _user_from_challenge(db, payload.challenge_token, "mfa_challenge")

    if not user.mfa_enabled or not user.mfa_secret:
        raise HTTPException(status_code=400, detail="2fa_not_enabled")

    _ensure_not_locked(user)

    if payload.token:
        if not _accept_totp(user, payload.token):
            _register_failure(db, user, "totp")
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
            _register_failure(db, user, "recovery_code")
            raise HTTPException(status_code=401, detail="code invalide")
        code_row.used_at = func.now()
        _audit(db, user, "auth.recovery_code_used")
    else:
        raise HTTPException(status_code=400, detail="token ou recovery_code requis")

    _register_success(user)
    access = _access_token(user)
    db.commit()
    return MfaVerifyOut(access_token=access, user=user)


@router.post("/logout", status_code=204)
def logout(db: Session = Depends(get_db), user: UserAccount = Depends(get_current_user)) -> None:
    """Révoque tous les jetons d'accès déjà émis pour l'utilisateur."""
    user.tokens_valid_after = _now()
    _audit(db, user, "auth.logout")
    db.commit()


@router.post("/mfa/setup", response_model=MfaSetupOut)
def mfa_setup(payload: MfaSetupIn, db: Session = Depends(get_db)) -> MfaSetupOut:
    """Enrôlement MFA (étape 1) : génère un secret en attente de confirmation."""
    user = _user_from_challenge(db, payload.challenge_token, "mfa_setup")
    if user.mfa_enabled:
        raise HTTPException(status_code=409, detail="2fa_already_enabled")
    _ensure_not_locked(user)

    user.mfa_secret = generate_secret()
    user.mfa_last_step = None
    db.commit()
    return MfaSetupOut(
        secret=user.mfa_secret,
        otpauth_uri=provisioning_uri(user.mfa_secret, user.email),
    )


@router.post("/mfa/setup/confirm", response_model=MfaSetupConfirmOut)
def mfa_setup_confirm(payload: MfaSetupConfirmIn, db: Session = Depends(get_db)) -> MfaSetupConfirmOut:
    """Enrôlement MFA (étape 2) : un premier code valide active la MFA et ouvre la session."""
    user = _user_from_challenge(db, payload.challenge_token, "mfa_setup")
    if user.mfa_enabled:
        raise HTTPException(status_code=409, detail="2fa_already_enabled")
    if not user.mfa_secret:
        raise HTTPException(status_code=400, detail="mfa_setup_not_started")
    _ensure_not_locked(user)

    if not _accept_totp(user, payload.token):
        _register_failure(db, user, "mfa_setup")
        raise HTTPException(status_code=401, detail="code invalide")

    user.mfa_enabled = True
    _audit(db, user, "auth.mfa_enrolled")
    user.mfa_enabled_at = _now()
    user.mfa_disabled_at = None

    # Nouveaux codes de secours : les anciens (éventuels) sont révoqués.
    for old in db.execute(
        select(UserRecoveryCode).where(UserRecoveryCode.user_id == user.id)
    ).scalars():
        db.delete(old)
    codes = [f"{secrets.token_hex(3)}-{secrets.token_hex(3)}" for _ in range(RECOVERY_CODES_COUNT)]
    for code in codes:
        db.add(
            UserRecoveryCode(
                user_id=user.id,
                code_hash=hash_recovery_code(code, secret=settings.recovery_codes_secret),
            )
        )

    _register_success(user)
    access = _access_token(user)
    db.commit()
    return MfaSetupConfirmOut(access_token=access, user=user, recovery_codes=codes)
