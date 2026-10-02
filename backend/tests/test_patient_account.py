"""Compte patient : vérification (email du dossier ou SMS), mot de passe oublié, changement de mot de passe."""

import re
import uuid
from datetime import UTC, date, datetime, timedelta
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.passwords import verify_password
from app.core.security import hash_cni
from app.db.models import Donneur, UserAccount

PWD = "motdepasse"


@pytest.fixture
def mails(monkeypatch) -> list[dict]:
    """Capture les emails envoyés par les routes d'authentification."""
    sent: list[dict] = []

    def fake_send(to: str, subject: str, body: str) -> None:
        link = next(w for w in body.split() if w.startswith("http"))
        sent.append({"to": to, "subject": subject, "link": link, "token": parse_qs(urlparse(link).query)["token"][0]})

    monkeypatch.setattr("app.api.routes.auth.send_patient_email", fake_send)
    return sent


@pytest.fixture
def sms(monkeypatch) -> list[dict]:
    """Capture les SMS (code extrait du texte)."""
    sent: list[dict] = []

    def fake_send(recipient: str, content: str, tag: str) -> None:
        sent.append({"to": recipient, "code": re.search(r"\b(\d{6})\b", content).group(1)})

    monkeypatch.setattr("app.api.routes.auth.send_sms", fake_send)
    return sent


def _dossier(db: Session, cni: str, email: str | None = None, telephone: str | None = None) -> Donneur:
    d = Donneur(
        nom="Sarr",
        prenom="Fatou",
        sexe="F",
        cni_hash=hash_cni(cni),
        date_naissance=date(1992, 3, 4),
        email=email,
        telephone=telephone,
    )
    db.add(d)
    db.commit()
    return d


def _register(client: TestClient, cni: str, email: str, password: str = PWD):
    return client.post(
        "/api/auth/register-patient",
        json={"cni": cni, "date_naissance": "1992-03-04", "email": email, "password": password},
    )


def _login(client: TestClient, email: str, password: str = PWD):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def _verified_patient(client: TestClient, db: Session, mails: list[dict], cni: str) -> str:
    email = f"v_{uuid.uuid4().hex[:8]}@example.com"
    _dossier(db, cni, email=email)
    assert _register(client, cni, email).status_code == 201
    assert client.post("/api/auth/verify-email", json={"token": mails[-1]["token"]}).status_code == 200
    return email


# --- Confirmation de l'adresse email -------------------------------------------


def test_register_sends_link_and_login_waits_for_confirmation(client, db_session, mails):
    email = f"c_{uuid.uuid4().hex[:8]}@example.com"
    _dossier(db_session, "EM100001", email=email)
    assert _register(client, "EM100001", email).status_code == 201

    assert len(mails) == 1 and mails[0]["to"] == email
    assert "/espace-patient/verification?token=" in mails[0]["link"]
    assert _login(client, email).status_code == 403
    assert _login(client, email).json()["detail"] == "email_not_verified"

    assert client.post("/api/auth/verify-email", json={"token": mails[0]["token"]}).status_code == 200
    assert _login(client, email).json()["access_token"]
    # Lien rejoué : sans effet, toujours accepté.
    assert client.post("/api/auth/verify-email", json={"token": mails[0]["token"]}).status_code == 200


def test_unverified_login_with_wrong_password_stays_401(client, db_session, mails):
    email = f"w_{uuid.uuid4().hex[:8]}@example.com"
    _dossier(db_session, "EM100002", email=email)
    _register(client, "EM100002", email)
    assert _login(client, email, "mauvais-mdp").status_code == 401


def test_verify_email_rejects_forged_or_other_tokens(client, db_session, mails):
    assert client.post("/api/auth/verify-email", json={"token": "CNTS1.abc.def"}).status_code == 400
    email = _verified_patient(client, db_session, mails, "EM100003")
    access = _login(client, email).json()["access_token"]
    # Un jeton d'accès n'est pas un lien de confirmation.
    assert client.post("/api/auth/verify-email", json={"token": access}).status_code == 400


def test_register_must_use_email_known_by_cnts(client, db_session, mails):
    _dossier(db_session, "EM100004", email="Fatou.Sarr@example.com")
    r = _register(client, "EM100004", "pirate@example.com")
    assert r.status_code == 400
    assert "adresse email enregistrée" in r.json()["detail"]
    assert mails == []
    assert _register(client, "EM100004", "fatou.sarr@example.com").status_code == 201


def test_unverified_registration_can_be_taken_over_by_new_attempt(client, db_session, mails, sms):
    d = _dossier(db_session, "EM100005", telephone="77 123 45 67")
    _register(client, "EM100005", "faute-de-frappe@example.com")
    first_user_id = d.user_id

    # Le SMS du premier essai a été validé, mais l'email n'a jamais été confirmé.
    first = _register(client, "EM100005", "faute-de-frappe@example.com")
    assert first.status_code == 429  # moins d'une minute après le premier SMS
    user = db_session.get(UserAccount, first_user_id)
    user.otp_last_sent_at = None
    db_session.commit()

    email = f"bon_{uuid.uuid4().hex[:8]}@example.com"
    r = _register(client, "EM100005", email)
    assert r.status_code == 201 and r.json()["verification"] == "sms"
    db_session.refresh(d)
    assert d.user_id == first_user_id
    assert client.post(
        "/api/auth/verify-phone", json={"challenge_token": r.json()["challenge_token"], "code": sms[-1]["code"]}
    ).status_code == 200
    assert mails[-1]["to"] == email
    assert client.post("/api/auth/verify-email", json={"token": mails[-1]["token"]}).status_code == 200


def test_retaking_registration_resets_phone_verification(client, db_session, mails, sms):
    """Un code SMS validé pour une adresse ne profite pas à une autre adresse saisie ensuite."""
    d = _dossier(db_session, "EM100013", telephone="771234568")
    r = _register(client, "EM100013", "titulaire@example.com")
    client.post("/api/auth/verify-phone", json={"challenge_token": r.json()["challenge_token"], "code": sms[-1]["code"]})
    user = db_session.get(UserAccount, d.user_id)
    user.otp_last_sent_at = None
    db_session.commit()

    _register(client, "EM100013", "pirate@example.com")
    db_session.refresh(user)
    assert user.phone_verified_at is None
    # Ni le lien envoyé au titulaire, ni une demande de renvoi ne valident l'adresse du tiers.
    assert client.post("/api/auth/verify-email", json={"token": mails[-1]["token"]}).status_code == 400
    n = len(mails)
    client.post("/api/auth/resend-verification", json={"email": "pirate@example.com"})
    client.post("/api/auth/password-reset/request", json={"email": "pirate@example.com"})
    assert len(mails) == n


def test_verified_account_cannot_be_taken_over(client, db_session, mails):
    _verified_patient(client, db_session, mails, "EM100006")
    assert _register(client, "EM100006", "autre@example.com").status_code == 409


def test_resend_verification_is_silent(client, db_session, mails):
    email = f"r_{uuid.uuid4().hex[:8]}@example.com"
    _dossier(db_session, "EM100007", email=email)
    _register(client, "EM100007", email)

    assert client.post("/api/auth/resend-verification", json={"email": email.upper()}).status_code == 202
    assert len(mails) == 2
    r = client.post("/api/auth/resend-verification", json={"email": "inconnu@example.com"})
    assert r.status_code == 202 and len(mails) == 2


# --- Mot de passe oublié --------------------------------------------------------


def test_password_reset_flow_is_single_use_and_revokes_sessions(client, db_session, mails):
    email = _verified_patient(client, db_session, mails, "EM100008")
    old_access = _login(client, email).json()["access_token"]

    assert client.post("/api/auth/password-reset/request", json={"email": email}).status_code == 202
    assert "/espace-patient/nouveau-mot-de-passe?token=" in mails[-1]["link"]
    token = mails[-1]["token"]

    r = client.post("/api/auth/password-reset/confirm", json={"token": token, "password": "nouveau-mdp"})
    assert r.status_code == 200
    assert _login(client, email).status_code == 401
    assert client.get("/api/me", headers={"Authorization": f"Bearer {old_access}"}).status_code == 401
    # Le lien ne sert qu'une fois : le mot de passe a changé.
    r = client.post("/api/auth/password-reset/confirm", json={"token": token, "password": "encore-autre"})
    assert r.status_code == 400


def test_password_reset_request_is_silent_and_skips_staff(client, db_session, mails):
    db_session.add(UserAccount(email="bio@example.com", password_hash="x", role="biologiste"))
    db_session.commit()
    for email in ("inconnu@example.com", "bio@example.com"):
        assert client.post("/api/auth/password-reset/request", json={"email": email}).status_code == 202
    assert mails == []


def test_password_reset_confirms_unverified_email(client, db_session, mails):
    email = f"u_{uuid.uuid4().hex[:8]}@example.com"
    _dossier(db_session, "EM100009", email=email)
    _register(client, "EM100009", email)
    client.post("/api/auth/password-reset/request", json={"email": email})
    client.post("/api/auth/password-reset/confirm", json={"token": mails[-1]["token"], "password": "nouveau-mdp"})
    assert _login(client, email, "nouveau-mdp").json()["access_token"]


def test_password_reset_rejects_short_password(client, db_session, mails):
    email = _verified_patient(client, db_session, mails, "EM100010")
    client.post("/api/auth/password-reset/request", json={"email": email})
    r = client.post("/api/auth/password-reset/confirm", json={"token": mails[-1]["token"], "password": "court"})
    assert r.status_code == 422


# --- Changement de mot de passe -------------------------------------------------


def test_change_password(client, db_session, mails):
    email = _verified_patient(client, db_session, mails, "EM100011")
    headers = {"Authorization": f"Bearer {_login(client, email).json()['access_token']}"}

    r = client.post(
        "/api/auth/change-password", json={"current_password": "faux", "new_password": "nouveau-mdp"}, headers=headers
    )
    assert r.status_code == 400

    r = client.post(
        "/api/auth/change-password", json={"current_password": PWD, "new_password": "nouveau-mdp"}, headers=headers
    )
    assert r.status_code == 204
    user = db_session.query(UserAccount).filter_by(email=email).one()
    db_session.refresh(user)
    assert verify_password("nouveau-mdp", user.password_hash)
    # Toutes les sessions sont fermées, y compris celle qui a fait le changement.
    assert client.get("/api/me", headers=headers).status_code == 401


def test_change_password_wrong_current_counts_toward_lockout(client, db_session, mails):
    email = _verified_patient(client, db_session, mails, "EM100012")
    headers = {"Authorization": f"Bearer {_login(client, email).json()['access_token']}"}
    body = {"current_password": "faux", "new_password": "nouveau-mdp"}
    codes = [client.post("/api/auth/change-password", json=body, headers=headers).status_code for _ in range(6)]
    assert codes[:5] == [400] * 5 and codes[5] == 429


# --- Vérification par SMS (dossier sans email, ou email différent) --------------------


def test_sms_flow_when_dossier_has_phone_only(client, db_session, mails, sms):
    d = _dossier(db_session, "SM200001", telephone="+221 77 123 45 67")
    email = f"s_{uuid.uuid4().hex[:8]}@example.com"
    r = _register(client, "SM200001", email)
    assert r.status_code == 201
    body = r.json()
    assert body["verification"] == "sms" and body["sms_sent"] is True
    assert body["telephone"].endswith("67") and "123" not in body["telephone"]
    assert sms[-1]["to"] == "221771234567"
    assert mails == []  # aucun lien tant que le téléphone n'est pas vérifié
    assert _login(client, email).status_code == 403

    challenge = body["challenge_token"]
    assert client.post("/api/auth/verify-phone", json={"challenge_token": challenge, "code": "000000" if sms[-1]["code"] != "000000" else "111111"}).status_code == 400
    assert client.post("/api/auth/verify-phone", json={"challenge_token": challenge, "code": sms[-1]["code"]}).status_code == 200
    # Le challenge ne sert plus une fois le téléphone vérifié.
    assert client.post("/api/auth/verify-phone", json={"challenge_token": challenge, "code": sms[-1]["code"]}).status_code == 400

    assert mails[-1]["to"] == email
    assert client.post("/api/auth/verify-email", json={"token": mails[-1]["token"]}).status_code == 200
    assert _login(client, email).json()["access_token"]
    db_session.refresh(d)
    assert d.email == email  # adresse confirmée reportée dans le dossier


def test_sms_used_when_email_differs_from_dossier(client, db_session, mails, sms):
    _dossier(db_session, "SM200002", email="ancienne@example.com", telephone="781112233")
    r = _register(client, "SM200002", "nouvelle@example.com")
    assert r.status_code == 201 and r.json()["verification"] == "sms"


def test_no_contact_in_dossier_refuses_online_registration(client, db_session, mails, sms):
    _dossier(db_session, "SM200003")
    r = _register(client, "SM200003", "x@example.com")
    assert r.status_code == 400 and "ni email ni téléphone" in r.json()["detail"]
    assert sms == [] and mails == []


def test_sms_code_attempts_are_limited(client, db_session, mails, sms):
    _dossier(db_session, "SM200004", telephone="771234500")
    r = _register(client, "SM200004", "lim@example.com").json()
    faux = "000000" if sms[-1]["code"] != "000000" else "111111"
    for _ in range(5):
        assert client.post("/api/auth/verify-phone", json={"challenge_token": r["challenge_token"], "code": faux}).status_code == 400
    # Même le bon code est refusé après 5 échecs : il faut en redemander un.
    last = client.post("/api/auth/verify-phone", json={"challenge_token": r["challenge_token"], "code": sms[-1]["code"]})
    assert last.status_code == 400 and "nouveau code" in last.json()["detail"]


def test_resend_sms_cooldown_and_daily_cap(client, db_session, mails, sms):
    d = _dossier(db_session, "SM200005", telephone="771234501")
    challenge = _register(client, "SM200005", "cap@example.com").json()["challenge_token"]
    assert client.post("/api/auth/resend-sms", json={"challenge_token": challenge}).status_code == 429

    user = db_session.get(UserAccount, d.user_id)
    statuses = []
    for _ in range(5):
        user.otp_last_sent_at = datetime.now(UTC) - timedelta(minutes=2)
        db_session.commit()
        statuses.append(client.post("/api/auth/resend-sms", json={"challenge_token": challenge}).status_code)
        db_session.refresh(user)
    assert statuses == [200, 200, 200, 200, 429]
    assert len(sms) == 5


def test_sms_provider_failure_is_reported(client, db_session, mails, monkeypatch):
    from app.core.sms import SmsError

    def boom(*_args, **_kwargs):
        raise SmsError("Brevo HTTP 401")

    monkeypatch.setattr("app.api.routes.auth.send_sms", boom)
    _dossier(db_session, "SM200006", telephone="771234502")
    r = _register(client, "SM200006", "ko@example.com")
    assert r.status_code == 201 and r.json()["sms_sent"] is False
