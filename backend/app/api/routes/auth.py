import datetime as dt
import hashlib
import hmac
import secrets
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.audit.events import log_event
from app.core.config import settings
from app.core.passwords import hash_password, hash_recovery_code, verify_password
from app.core.patient_mail import (
    password_reset_email,
    portal_link,
    send_patient_email,
    verification_email,
)
from app.core.security import hash_cni
from app.core.sms import SmsError, mask_phone, normalize_phone, send_sms
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
from app.schemas.patient import (
    EmailIn,
    EmailTokenIn,
    PhoneCodeIn,
    PhoneResendIn,
    PasswordChangeIn,
    PasswordResetConfirmIn,
    PatientRegisterIn,
)

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
EMAIL_VERIFY_TTL_SECONDS = 48 * 60 * 60
PASSWORD_RESET_TTL_SECONDS = 60 * 60
PASSWORD_MIN_LENGTH = 8
PHONE_CHALLENGE_TTL_SECONDS = 30 * 60
OTP_TTL = dt.timedelta(minutes=10)
OTP_MAX_ATTEMPTS = 5
OTP_RESEND_COOLDOWN = dt.timedelta(seconds=60)
OTP_MAX_SENDS_PER_DAY = 5


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

    # Patient : adresse email à confirmer avant la première connexion. Révélé seulement
    # après un mot de passe correct, donc sans fuite sur l'existence du compte.
    if not _is_staff(user) and user.email_verified_at is None:
        raise HTTPException(status_code=403, detail="email_not_verified")

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


EMAIL_DOSSIER_DIFFERENT = (
    "Utilisez l'adresse email enregistrée dans votre dossier au CNTS. "
    "Si elle a changé, contactez le CNTS pour la mettre à jour."
)
LIEN_INVALIDE = "Ce lien n'est plus valide. Faites une nouvelle demande."
AUCUN_CONTACT = (
    "Votre dossier ne contient ni email ni téléphone permettant de vérifier votre identité en ligne. "
    "Contactez le CNTS ou présentez-vous lors de votre prochain don pour les faire ajouter."
)
VERIFICATION_EXPIREE = "La vérification a expiré. Recommencez la création du compte."


def _aware(value: dt.datetime | None) -> dt.datetime | None:
    if value is not None and value.tzinfo is None:  # SQLite renvoie des datetimes naïfs
        return value.replace(tzinfo=dt.timezone.utc)
    return value


def _dossier_email(user: UserAccount) -> str:
    d = user.donneur
    return (d.email or "").strip().lower() if d is not None else ""


def _identity_proven(user: UserAccount) -> bool:
    """Le titulaire du compte contrôle un moyen de contact déjà connu du CNTS.

    Soit l'email du compte est celui du dossier, soit un code a été reçu sur le
    téléphone du dossier. Sans cela, aucun lien n'est envoyé à l'email saisi.
    """
    return user.phone_verified_at is not None or _dossier_email(user) == user.email.lower()


def _otp_digest(user: UserAccount, code: str) -> str:
    return hmac.new(
        settings.auth_token_secret.encode("utf-8"), f"{user.id}:{code}".encode("utf-8"), hashlib.sha256
    ).hexdigest()


def _ensure_otp_send_allowed(user: UserAccount) -> None:
    """1 SMS par minute et 5 par jour et par compte : chaque SMS est facturé."""
    now = _now()
    last = _aware(user.otp_last_sent_at)
    if last is None:
        return
    if now - last < OTP_RESEND_COOLDOWN:
        raise HTTPException(status_code=429, detail="Patientez une minute avant de demander un nouveau code.")
    if last.date() == now.date() and (user.otp_sends_today or 0) >= OTP_MAX_SENDS_PER_DAY:
        raise HTTPException(status_code=429, detail="Nombre maximal de codes atteint pour aujourd'hui. Réessayez demain.")


def _send_otp(user: UserAccount, phone: str) -> bool:
    """Nouveau code à 6 chiffres sur le téléphone du dossier. Renvoie False si le SMS n'est pas parti."""
    code = f"{secrets.randbelow(10**6):06d}"
    now = _now()
    last = _aware(user.otp_last_sent_at)
    user.otp_sends_today = (user.otp_sends_today or 0) + 1 if last and last.date() == now.date() else 1
    user.otp_hash = _otp_digest(user, code)
    user.otp_expires_at = now + OTP_TTL
    user.otp_attempts = 0
    user.otp_last_sent_at = now
    try:
        send_sms(
            phone,
            f"CNTS: votre code d'activation de l'espace donneur est {code}. "
            "Valable 10 minutes. Ne le communiquez a personne.",
            tag="activation-espace-donneur",
        )
    except SmsError:
        return False
    return True


def _phone_challenge(user: UserAccount) -> str:
    return sign_token(
        {"sub": str(user.id), "type": "phone_verify"},
        secret=settings.auth_token_secret,
        ttl_seconds=PHONE_CHALLENGE_TTL_SECONDS,
    )


def _user_from_phone_challenge(db: Session, token: str) -> tuple[UserAccount, str]:
    payload = verify_token(token, secret=settings.auth_token_secret)
    if not payload or payload.get("type") != "phone_verify":
        raise HTTPException(status_code=400, detail=VERIFICATION_EXPIREE)
    try:
        user = db.get(UserAccount, uuid.UUID(str(payload.get("sub"))))
    except ValueError:
        user = None
    if user is None or not user.is_active or _is_staff(user) or user.phone_verified_at is not None:
        raise HTTPException(status_code=400, detail=VERIFICATION_EXPIREE)
    phone = normalize_phone(user.donneur.telephone if user.donneur else None)
    if phone is None:
        raise HTTPException(status_code=400, detail=VERIFICATION_EXPIREE)
    return user, phone


def _check_password_policy(password: str) -> None:
    if len(password) < PASSWORD_MIN_LENGTH:
        raise HTTPException(
            status_code=422,
            detail=f"Le mot de passe doit contenir au moins {PASSWORD_MIN_LENGTH} caractères",
        )


def _password_fingerprint(user: UserAccount) -> str:
    """Empreinte du mot de passe courant : un lien de réinitialisation meurt dès qu'il change."""
    return hashlib.sha256(user.password_hash.encode("utf-8")).hexdigest()[:16]


def _prenom(user: UserAccount) -> str:
    return user.donneur.prenom if user.donneur is not None else ""


def _send_verification(background: BackgroundTasks, user: UserAccount) -> None:
    token = sign_token(
        {"sub": str(user.id), "type": "email_verify", "em": user.email},
        secret=settings.auth_token_secret,
        ttl_seconds=EMAIL_VERIFY_TTL_SECONDS,
    )
    subject, body = verification_email(_prenom(user), portal_link("/espace-patient/verification", token))
    background.add_task(send_patient_email, user.email, subject, body)


def _user_from_email_token(db: Session, token: str, kind: str) -> tuple[UserAccount, dict]:
    payload = verify_token(token, secret=settings.auth_token_secret)
    if not payload or payload.get("type") != kind:
        raise HTTPException(status_code=400, detail=LIEN_INVALIDE)
    try:
        user = db.get(UserAccount, uuid.UUID(str(payload.get("sub"))))
    except ValueError:
        user = None
    if user is None or not user.is_active or _is_staff(user):
        raise HTTPException(status_code=400, detail=LIEN_INVALIDE)
    return user, payload


def _patient_by_email(db: Session, email: str) -> UserAccount | None:
    user = db.execute(
        select(UserAccount).where(func.lower(UserAccount.email) == email.lower())
    ).scalar_one_or_none()
    if user is None or not user.is_active or _is_staff(user):
        return None
    return user


@router.post("/register-patient", status_code=201)
def register_patient(
    payload: PatientRegisterIn, background: BackgroundTasks, db: Session = Depends(get_db)
) -> dict:
    """
    Crée un compte patient lié à un dossier donneur EXISTANT.

    Le donneur prouve son identité avec son numéro de CNI (comparé au hash stocké)
    et sa date de naissance. Aucun dossier n'est créé ici : un donneur inconnu du
    CNTS ne peut pas ouvrir de compte. Le compte reste inutilisable tant que
    l'adresse email n'est pas confirmée par le lien envoyé.
    """
    _check_password_policy(payload.password)

    donneur = db.execute(
        select(Donneur).where(
            Donneur.cni_hash == hash_cni(payload.cni),
            Donneur.deleted_at.is_(None),
        )
    ).scalar_one_or_none()
    if donneur is None or donneur.date_naissance is None or donneur.date_naissance != payload.date_naissance:
        raise HTTPException(status_code=400, detail=IDENTITE_NON_RECONNUE)

    # Compte déjà créé mais jamais confirmé (email erroné, lien perdu, usurpation) :
    # on le reprend plutôt que de bloquer le dossier.
    user = db.get(UserAccount, donneur.user_id) if donneur.user_id is not None else None
    if user is not None and (user.email_verified_at is not None or _is_staff(user)):
        raise HTTPException(
            status_code=409,
            detail="Un compte existe déjà pour ce dossier donneur. Connectez-vous ou contactez le CNTS.",
        )

    email = payload.email.lower()
    # Connaître la CNI et la date de naissance ne suffit pas : il faut aussi prouver
    # qu'on contrôle l'email du dossier (lien) ou son téléphone (code SMS).
    telephone = normalize_phone(donneur.telephone)
    if (donneur.email or "").strip().lower() == email:
        mode = "email"
    elif telephone:
        mode = "sms"
    elif donneur.email:
        raise HTTPException(status_code=400, detail=EMAIL_DOSSIER_DIFFERENT)
    else:
        raise HTTPException(status_code=400, detail=AUCUN_CONTACT)

    if user is not None and mode == "sms":
        _ensure_otp_send_allowed(user)

    autre = db.execute(select(UserAccount).where(func.lower(UserAccount.email) == email)).scalar_one_or_none()
    if autre is not None and (user is None or autre.id != user.id):
        raise HTTPException(status_code=409, detail="Cette adresse email est déjà utilisée.")

    if user is None:
        user = UserAccount(email=email, password_hash=hash_password(payload.password), role=PATIENT_ROLE)
        db.add(user)
        db.flush()
        donneur.user_id = user.id
        _audit(db, user, "auth.patient_registered")
    else:
        user.email = email
        user.password_hash = hash_password(payload.password)
        # Une vérification SMS antérieure ne vaut pas pour la nouvelle adresse.
        user.phone_verified_at = None
        _audit(db, user, "auth.patient_registration_retaken")
    db.flush()

    if mode == "email":
        db.commit()
        db.refresh(user)
        _send_verification(background, user)
        return {"ok": True, "verification": "email"}

    sms_sent = _send_otp(user, telephone)
    db.commit()
    return {
        "ok": True,
        "verification": "sms",
        "challenge_token": _phone_challenge(user),
        "telephone": mask_phone(telephone),
        "sms_sent": sms_sent,
    }


@router.post("/verify-phone")
def verify_phone(payload: PhoneCodeIn, background: BackgroundTasks, db: Session = Depends(get_db)) -> dict:
    """Code SMS reçu sur le téléphone du dossier ; envoie ensuite le lien de confirmation de l'email."""
    user, _ = _user_from_phone_challenge(db, payload.challenge_token)
    expires = _aware(user.otp_expires_at)
    if user.otp_hash is None or expires is None or expires < _now():
        raise HTTPException(status_code=400, detail="Ce code a expiré. Demandez-en un nouveau.")
    if (user.otp_attempts or 0) >= OTP_MAX_ATTEMPTS:
        raise HTTPException(status_code=400, detail="Trop d'essais. Demandez un nouveau code.")
    if not hmac.compare_digest(user.otp_hash, _otp_digest(user, payload.code)):
        user.otp_attempts = (user.otp_attempts or 0) + 1
        _audit(db, user, "auth.otp_failed", attempts=user.otp_attempts)
        db.commit()
        raise HTTPException(status_code=400, detail="Code incorrect.")

    user.phone_verified_at = _now()
    user.otp_hash = None
    user.otp_expires_at = None
    _audit(db, user, "auth.phone_verified")
    db.commit()
    db.refresh(user)
    _send_verification(background, user)
    return {"ok": True}


@router.post("/resend-sms")
def resend_sms(payload: PhoneResendIn, db: Session = Depends(get_db)) -> dict:
    """Nouveau code SMS sur le téléphone du dossier."""
    user, phone = _user_from_phone_challenge(db, payload.challenge_token)
    _ensure_otp_send_allowed(user)
    sent = _send_otp(user, phone)
    db.commit()
    if not sent:
        raise HTTPException(status_code=503, detail="L'envoi du SMS a échoué. Réessayez dans quelques minutes.")
    return {"ok": True, "telephone": mask_phone(phone)}


@router.post("/verify-email")
def verify_email(payload: EmailTokenIn, db: Session = Depends(get_db)) -> dict:
    """Confirme l'adresse email d'un compte patient (lien reçu à l'inscription)."""
    user, data = _user_from_email_token(db, payload.token, "email_verify")
    # Le lien ne vaut que pour l'adresse à laquelle il a été envoyé.
    if str(data.get("em", "")).lower() != user.email.lower() or not _identity_proven(user):
        raise HTTPException(status_code=400, detail=LIEN_INVALIDE)
    if user.email_verified_at is None:
        user.email_verified_at = _now()
        # Dossier sans email : l'adresse confirmée devient l'email de contact du donneur.
        if user.donneur is not None and not user.donneur.email:
            user.donneur.email = user.email
        _audit(db, user, "auth.email_verified")
        db.commit()
    return {"ok": True}


@router.post("/resend-verification", status_code=202)
def resend_verification(payload: EmailIn, background: BackgroundTasks, db: Session = Depends(get_db)) -> dict:
    """Renvoie le lien de confirmation. Réponse identique que le compte existe ou non."""
    user = _patient_by_email(db, payload.email)
    if user is not None and user.email_verified_at is None and _identity_proven(user):
        _send_verification(background, user)
    return {"ok": True}


@router.post("/password-reset/request", status_code=202)
def password_reset_request(payload: EmailIn, background: BackgroundTasks, db: Session = Depends(get_db)) -> dict:
    """Mot de passe oublié (comptes patients). Réponse identique que le compte existe ou non.

    Le personnel n'est pas concerné : son mot de passe est réinitialisé par un administrateur.
    """
    user = _patient_by_email(db, payload.email)
    # Compte jamais vérifié : le lien de réinitialisation ne doit pas servir à le valider.
    if user is not None and (user.email_verified_at is not None or _identity_proven(user)):
        token = sign_token(
            {"sub": str(user.id), "type": "password_reset", "pv": _password_fingerprint(user)},
            secret=settings.auth_token_secret,
            ttl_seconds=PASSWORD_RESET_TTL_SECONDS,
        )
        subject, body = password_reset_email(
            _prenom(user), portal_link("/espace-patient/nouveau-mot-de-passe", token)
        )
        background.add_task(send_patient_email, user.email, subject, body)
        _audit(db, user, "auth.password_reset_requested")
        db.commit()
    return {"ok": True}


@router.post("/password-reset/confirm")
def password_reset_confirm(payload: PasswordResetConfirmIn, db: Session = Depends(get_db)) -> dict:
    """Nouveau mot de passe via le lien reçu par email. Toutes les sessions sont révoquées."""
    user, data = _user_from_email_token(db, payload.token, "password_reset")
    if data.get("pv") != _password_fingerprint(user):
        raise HTTPException(status_code=400, detail=LIEN_INVALIDE)
    if user.email_verified_at is None and not _identity_proven(user):
        raise HTTPException(status_code=400, detail=LIEN_INVALIDE)
    _check_password_policy(payload.password)

    user.password_hash = hash_password(payload.password)
    # Le lien reçu prouve aussi que la personne contrôle l'adresse email.
    if user.email_verified_at is None:
        user.email_verified_at = _now()
    user.tokens_valid_after = _now()
    _register_success(user)
    _audit(db, user, "auth.password_reset")
    db.commit()
    return {"ok": True}


@router.post("/change-password", status_code=204)
def change_password(
    payload: PasswordChangeIn,
    db: Session = Depends(get_db),
    user: UserAccount = Depends(get_current_user),
) -> None:
    """Changement de mot de passe par l'utilisateur connecté. Toutes les sessions sont révoquées."""
    _ensure_not_locked(user)
    if not verify_password(payload.current_password, user.password_hash):
        _register_failure(db, user, "change_password")
        # 400 et non 401 : la session reste valide, seul le mot de passe saisi est faux.
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect.")
    _check_password_policy(payload.new_password)

    user.password_hash = hash_password(payload.new_password)
    user.tokens_valid_after = _now()
    _register_success(user)
    _audit(db, user, "auth.password_changed")
    db.commit()


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
