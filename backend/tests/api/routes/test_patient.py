import uuid
from datetime import UTC, date, datetime, timedelta

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.passwords import hash_password
from app.core.security import hash_cni
from app.db.models import CarteDonneur, Don, Donneur, PointsHistorique, UserAccount


def test_get_my_profile(client: TestClient, db_session: Session):
    # Create user and linked donor
    email = f"patient_{uuid.uuid4()}@example.com"
    password = "password"
    user = UserAccount(email=email, password_hash=hash_password(password), email_verified_at=datetime.now(UTC))
    db_session.add(user)
    db_session.commit()

    donneur = Donneur(nom="Test", prenom="User", sexe="M", cni_hash="hash", email=email, user=user)
    db_session.add(donneur)
    db_session.commit()

    # Login
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    token = response.json()["access_token"]

    # Get Profile
    response = client.get("/api/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["nom"] == "Test"
    assert data["email"] == email


def _patient(db_session: Session, cni_hash: str) -> tuple[UserAccount, Donneur, str]:
    email = f"p_{uuid.uuid4()}@example.com"
    user = UserAccount(email=email, password_hash=hash_password("password"), email_verified_at=datetime.now(UTC))
    donneur = Donneur(nom="Diop", prenom="Awa", sexe="F", cni_hash=cni_hash, user=user)
    db_session.add_all([user, donneur])
    db_session.commit()
    return user, donneur, email


def _token(client: TestClient, email: str) -> dict:
    token = client.post("/api/auth/login", json={"email": email, "password": "password"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_my_donations_only_mine_and_no_status(client: TestClient, db_session: Session):
    _, moi, email = _patient(db_session, "hash_dons_moi")
    _, autre, _ = _patient(db_session, "hash_dons_autre")
    db_session.add_all(
        [
            Don(donneur_id=moi.id, din="DIN-MOI-1", date_don=date(2026, 1, 10), type_don="SANG_TOTAL"),
            Don(donneur_id=moi.id, din="DIN-MOI-2", date_don=date(2026, 5, 3), type_don="PLASMA",
                statut_qualification="REJETE"),
            Don(donneur_id=autre.id, din="DIN-AUTRE", date_don=date(2026, 2, 1), type_don="SANG_TOTAL"),
        ]
    )
    db_session.commit()

    r = client.get("/api/me/dons", headers=_token(client, email))
    assert r.status_code == 200
    data = r.json()
    assert [d["date_don"] for d in data] == ["2026-05-03", "2026-01-10"]
    # Aucun statut de qualification ni identifiant de don n'est exposé au patient.
    assert all(set(d) == {"id", "date_don", "type_don"} for d in data)


def test_my_card(client: TestClient, db_session: Session):
    _, moi, email = _patient(db_session, "hash_carte")
    headers = _token(client, email)
    assert client.get("/api/me/carte", headers=headers).status_code == 404

    carte = CarteDonneur(donneur_id=moi.id, numero_carte="CNTS-0001", niveau="ARGENT", points=120, total_dons=4)
    db_session.add(carte)
    db_session.flush()
    db_session.add(PointsHistorique(carte_id=carte.id, type_operation="DON", points=30, description="Don du 03/05"))
    db_session.commit()

    r = client.get("/api/me/carte", headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["numero_carte"] == "CNTS-0001"
    assert body["niveau"] == "ARGENT"
    assert body["historique"][0]["points"] == 30


def _donneur_sans_compte(db_session: Session, cni: str, naissance: date, email: str | None = None) -> Donneur:
    d = Donneur(
        nom="Ndiaye", prenom="Moussa", sexe="M", cni_hash=hash_cni(cni), date_naissance=naissance, email=email
    )
    db_session.add(d)
    db_session.commit()
    return d


def test_register_patient_links_existing_donor(client: TestClient, db_session: Session):
    email = f"new_{uuid.uuid4()}@example.com"
    d = _donneur_sans_compte(db_session, "1 234 5678 90123", date(1990, 4, 12), email=email)
    r = client.post(
        "/api/auth/register-patient",
        json={"cni": "1234567890123", "date_naissance": "1990-04-12", "email": email, "password": "motdepasse"},
    )
    assert r.status_code == 201, r.text
    db_session.refresh(d)
    assert d.user_id is not None

    # Après confirmation de l'email (voir test_patient_account.py), le nouveau compte
    # se connecte et voit son propre dossier.
    d.user.email_verified_at = datetime.now(UTC)
    db_session.commit()
    r = client.get("/api/me", headers={**_token_pw(client, email, "motdepasse")})
    assert r.status_code == 200
    assert r.json()["nom"] == "Ndiaye"

    # Deuxième tentative sur le même dossier : refusée.
    r = client.post(
        "/api/auth/register-patient",
        json={"cni": "1234567890123", "date_naissance": "1990-04-12", "email": "x" + email, "password": "motdepasse"},
    )
    assert r.status_code == 409


def _token_pw(client: TestClient, email: str, password: str) -> dict:
    token = client.post("/api/auth/login", json={"email": email, "password": password}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_register_patient_wrong_identity_is_generic(client: TestClient, db_session: Session):
    _donneur_sans_compte(db_session, "AB998877", date(1985, 1, 1))
    base = {"email": f"z_{uuid.uuid4()}@example.com", "password": "motdepasse"}
    mauvaise_date = client.post(
        "/api/auth/register-patient", json={**base, "cni": "AB998877", "date_naissance": "1985-01-02"}
    )
    cni_inconnue = client.post(
        "/api/auth/register-patient", json={**base, "cni": "ZZ000000", "date_naissance": "1985-01-01"}
    )
    assert mauvaise_date.status_code == cni_inconnue.status_code == 400
    assert mauvaise_date.json()["detail"] == cni_inconnue.json()["detail"]


def test_register_patient_short_password(client: TestClient, db_session: Session):
    _donneur_sans_compte(db_session, "CC112233", date(2000, 6, 6))
    r = client.post(
        "/api/auth/register-patient",
        json={"cni": "CC112233", "date_naissance": "2000-06-06", "email": f"s_{uuid.uuid4()}@example.com", "password": "court"},
    )
    assert r.status_code == 422


def test_update_profile_ignores_identity_and_accepts_null(client: TestClient, db_session: Session):
    _, moi, email = _patient(db_session, "hash_maj_profil")
    headers = _token(client, email)
    r = client.put(
        "/api/me",
        json={"nom": None, "prenom": "Pirate", "telephone": "+221 77 000 00 00", "adresse": None},
        headers=headers,
    )
    assert r.status_code == 200, r.text
    db_session.refresh(moi)
    # Nom et prénom ne sont pas modifiables en ligne ; null efface une coordonnée sans erreur 500.
    assert (moi.nom, moi.prenom) == ("Diop", "Awa")
    assert moi.telephone == "+221 77 000 00 00"
    assert moi.adresse is None


def test_update_profile_too_long_is_422(client: TestClient, db_session: Session):
    _, _, email = _patient(db_session, "hash_maj_long")
    r = client.put("/api/me", json={"telephone": "7" * 33}, headers=_token(client, email))
    assert r.status_code == 422


def test_list_limit_is_capped(client: TestClient, db_session: Session):
    _, _, email = _patient(db_session, "hash_limit")
    headers = _token(client, email)
    for path in ("/api/me/appointments", "/api/me/documents", "/api/me/dons"):
        assert client.get(f"{path}?limit=100000", headers=headers).status_code == 422


def test_deleted_donor_loses_access(client: TestClient, db_session: Session):
    _, moi, email = _patient(db_session, "hash_supprime")
    headers = _token(client, email)
    moi.deleted_at = datetime.now(UTC)
    db_session.commit()
    assert client.get("/api/me", headers=headers).status_code == 404
    assert client.get("/api/me/dons", headers=headers).status_code == 404
