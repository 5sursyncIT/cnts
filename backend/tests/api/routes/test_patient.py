from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.core.security import get_password_hash
from app.db.models import UserAccount, Donneur
import uuid

def test_get_my_profile(client: TestClient, db: Session):
    # Create user and linked donor
    email = f"patient_{uuid.uuid4()}@example.com"
    password = "password"
    user = UserAccount(email=email, password_hash=get_password_hash(password))
    db.add(user)
    db.commit()
    
    donneur = Donneur(
        nom="Test", prenom="User", sexe="M", 
        cni_hash="hash", user=user
    )
    db.add(donneur)
    db.commit()
    
    # Login
    response = client.post("/api/auth/login", data={"username": email, "password": password})
    token = response.json()["access_token"]
    
    # Get Profile
    response = client.get("/api/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    data = response.json()
    assert data["nom"] == "Test"
    assert data["email"] == email

def test_create_appointment(client: TestClient, db: Session):
    # Setup user
    email = f"rdv_{uuid.uuid4()}@example.com"
    password = "password"
    user = UserAccount(email=email, password_hash=get_password_hash(password))
    donneur = Donneur(nom="Rdv", prenom="Test", sexe="F", cni_hash="hash_rdv", user=user)
    db.add(user)
    db.add(donneur)
    db.commit()
    
    # Login
    response = client.post("/api/auth/login", data={"username": email, "password": password})
    token = response.json()["access_token"]
    
    # Create Appointment
    rdv_data = {
        "date_prevue": "2026-06-15T10:00:00",
        "type_rdv": "DON_SANG",
        "lieu": "Centre Principal"
    }
    response = client.post(
        "/api/me/appointments", 
        json=rdv_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    assert response.json()["statut"] == "CONFIRME"
