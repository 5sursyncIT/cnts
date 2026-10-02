"""MFA obligatoire pour le personnel : enrôlement, anti-rejeu et verrouillage."""

import time
from datetime import UTC, datetime
import uuid

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.passwords import hash_password
from app.core.totp import _hotp, generate_totp
from app.db.models import UserAccount

PWD = "Motdepasse-Solide-1"


def _staff(db: Session, email: str = "bio@cnts.local", role: str = "biologiste") -> UserAccount:
    user = UserAccount(
        id=uuid.uuid4(), email=email, password_hash=hash_password(PWD), is_active=True, role=role,
        email_verified_at=datetime.now(UTC),
    )
    db.add(user)
    db.commit()
    return user


def _login(client: TestClient, email: str = "bio@cnts.local", password: str = PWD):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def _next_code(secret: str) -> str:
    """Code du pas suivant : valide (fenêtre ±1) et distinct du code courant."""
    return _hotp(secret, int(time.time()) // 30 + 1)


def test_staff_without_mfa_gets_setup_challenge_not_access(client: TestClient, db_session: Session):
    _staff(db_session)
    body = _login(client).json()
    assert body["mfa_required"] is True
    assert body["mfa_setup_required"] is True
    assert body["access_token"] is None

    # Le jeton d'enrôlement ne permet pas la vérification MFA classique.
    r = client.post("/api/auth/mfa/verify", json={"challenge_token": body["challenge_token"], "token": "123456"})
    assert r.status_code == 401


def test_enrollment_then_login_requires_totp(client: TestClient, db_session: Session):
    _staff(db_session)
    challenge = _login(client).json()["challenge_token"]

    setup = client.post("/api/auth/mfa/setup", json={"challenge_token": challenge}).json()
    assert setup["otpauth_uri"].startswith("otpauth://totp/")
    secret = setup["secret"]

    bad = client.post("/api/auth/mfa/setup/confirm", json={"challenge_token": challenge, "token": "000000"})
    assert bad.status_code == 401

    ok = client.post(
        "/api/auth/mfa/setup/confirm", json={"challenge_token": challenge, "token": generate_totp(secret)}
    )
    assert ok.status_code == 200
    assert ok.json()["access_token"]
    assert len(ok.json()["recovery_codes"]) == 8

    # Enrôlement terminé : un nouveau login exige le code TOTP.
    body = _login(client).json()
    assert body["mfa_required"] is True and body["mfa_setup_required"] is False
    r = client.post(
        "/api/auth/mfa/verify", json={"challenge_token": body["challenge_token"], "token": _next_code(secret)}
    )
    assert r.status_code == 200

    # Un code de secours fonctionne une seule fois.
    code = ok.json()["recovery_codes"][0]
    ch = _login(client).json()["challenge_token"]
    assert client.post("/api/auth/mfa/verify", json={"challenge_token": ch, "recovery_code": code}).status_code == 200
    ch = _login(client).json()["challenge_token"]
    assert client.post("/api/auth/mfa/verify", json={"challenge_token": ch, "recovery_code": code}).status_code == 401


def test_totp_code_cannot_be_replayed(client: TestClient, db_session: Session):
    _staff(db_session)
    challenge = _login(client).json()["challenge_token"]
    secret = client.post("/api/auth/mfa/setup", json={"challenge_token": challenge}).json()["secret"]
    code = generate_totp(secret)
    assert client.post(
        "/api/auth/mfa/setup/confirm", json={"challenge_token": challenge, "token": code}
    ).status_code == 200

    ch = _login(client).json()["challenge_token"]
    assert client.post("/api/auth/mfa/verify", json={"challenge_token": ch, "token": code}).status_code == 401


def test_account_locked_after_repeated_failures(client: TestClient, db_session: Session):
    _staff(db_session)
    codes = [_login(client, password="mauvais").status_code for _ in range(5)]
    assert codes == [401] * 5
    # Même le bon mot de passe est refusé pendant le verrouillage.
    assert _login(client).status_code == 429


def test_mfa_code_bruteforce_locks_account(client: TestClient, db_session: Session):
    _staff(db_session)
    challenge = _login(client).json()["challenge_token"]
    client.post("/api/auth/mfa/setup", json={"challenge_token": challenge})
    codes = [
        client.post("/api/auth/mfa/setup/confirm", json={"challenge_token": challenge, "token": "000000"}).status_code
        for _ in range(6)
    ]
    assert codes[:5] == [401] * 5 and codes[5] == 429


def test_patient_login_unchanged(client: TestClient, db_session: Session):
    _staff(db_session, email="patient@cnts.local", role="PATIENT")
    body = _login(client, email="patient@cnts.local").json()
    assert body["mfa_required"] is False and body["access_token"]


def test_logout_revokes_access_token(client: TestClient, db_session: Session):
    from app.api.deps import require_staff
    from app.main import app

    _staff(db_session)
    challenge = _login(client).json()["challenge_token"]
    secret = client.post("/api/auth/mfa/setup", json={"challenge_token": challenge}).json()["secret"]
    token = client.post(
        "/api/auth/mfa/setup/confirm", json={"challenge_token": challenge, "token": generate_totp(secret)}
    ).json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    saved = app.dependency_overrides.pop(require_staff)
    try:
        assert client.get("/api/tableau-de-bord", headers=headers).status_code == 200
        time.sleep(1.1)  # iat à la seconde : on sort de la seconde d'émission
        assert client.post("/api/auth/logout", headers=headers).status_code == 204
        assert client.get("/api/tableau-de-bord", headers=headers).status_code == 401
    finally:
        app.dependency_overrides[require_staff] = saved
