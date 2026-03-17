import uuid

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.passwords import hash_password
from app.db.models import Donneur, UserAccount


def test_get_my_profile(client: TestClient, db_session: Session):
    # Create user and linked donor
    email = f"patient_{uuid.uuid4()}@example.com"
    password = "password"
    user = UserAccount(email=email, password_hash=hash_password(password))
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


def test_create_appointment(client: TestClient, db_session: Session):
    # Setup user
    email = f"rdv_{uuid.uuid4()}@example.com"
    password = "password"
    user = UserAccount(email=email, password_hash=hash_password(password))
    donneur = Donneur(nom="Rdv", prenom="Test", sexe="F", cni_hash="hash_rdv", user=user)
    db_session.add(user)
    db_session.add(donneur)
    db_session.commit()

    # Login
    response = client.post("/api/auth/login", json={"email": email, "password": password})
    token = response.json()["access_token"]

    # Create Appointment
    rdv_data = {
        "date_prevue": "2026-06-15T10:00:00",
        "type_rdv": "DON_SANG",
        "lieu": "Centre Principal",
    }
    response = client.post(
        "/api/me/appointments", json=rdv_data, headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["statut"] == "CONFIRME"
