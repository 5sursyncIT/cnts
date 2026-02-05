"""
Tests pour le module Chaîne du Froid (Cold Chain).

Vérifie:
- CRUD des espaces de stockage (storages)
- Enregistrement des relevés de température (readings)
- Détection des alertes (OUT_OF_RANGE)
"""

import datetime as dt
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app

# Base de données de test en mémoire
SQLALCHEMY_TEST_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    """Créer les tables avant chaque test et les supprimer après."""
    previous = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if previous is None:
        del app.dependency_overrides[get_db]
    else:
        app.dependency_overrides[get_db] = previous


@pytest.fixture
def storage_id():
    """Créer un espace de stockage de test."""
    response = client.post(
        "/api/stock/cold-chain/storages",
        json={
            "code": "FRIGO_01",
            "name": "Frigo Banque de Sang",
            "location": "Salle de stockage 1",
            "min_temp": 2.0,
            "max_temp": 6.0,
            "is_active": True,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_create_storage():
    """Test de création d'un espace de stockage."""
    response = client.post(
        "/api/stock/cold-chain/storages",
        json={
            "code": "CONGELATEUR_01",
            "name": "Congélateur Plasma",
            "min_temp": -30.0,
            "max_temp": -18.0,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["code"] == "CONGELATEUR_01"
    assert data["min_temp"] == -30.0
    assert data["max_temp"] == -18.0
    assert data["is_active"] is True


def test_create_storage_invalid_temp():
    """Test de création avec températures invalides."""
    response = client.post(
        "/api/stock/cold-chain/storages",
        json={
            "code": "INVALID_TEMP",
            "name": "Invalid Temp",
            "min_temp": 10.0,
            "max_temp": 5.0,  # min > max
        },
    )
    assert response.status_code == 400


def test_create_reading(storage_id):
    """Test d'enregistrement d'un relevé de température."""
    response = client.post(
        "/api/stock/cold-chain/readings",
        json={
            "storage_id": storage_id,
            "temperature_c": 4.5,
            "source": "sensor_01",
            "note": "Routine check",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["temperature_c"] == 4.5
    assert data["storage_id"] == storage_id


def test_list_alerts_ok(storage_id):
    """Test qu'aucune alerte n'est levée si la température est correcte."""
    # Enregistrer une température correcte (entre 2 et 6)
    client.post(
        "/api/stock/cold-chain/readings",
        json={
            "storage_id": storage_id,
            "temperature_c": 4.0,
        },
    )

    response = client.get("/api/stock/cold-chain/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) == 1
    assert alerts[0]["status"] == "OK"
    assert alerts[0]["last_temperature_c"] == 4.0


def test_list_alerts_out_of_range(storage_id):
    """Test qu'une alerte est levée si la température est hors limites."""
    # Enregistrer une température trop élevée (8.0 > 6.0)
    client.post(
        "/api/stock/cold-chain/readings",
        json={
            "storage_id": storage_id,
            "temperature_c": 8.0,
        },
    )

    response = client.get("/api/stock/cold-chain/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) == 1
    assert alerts[0]["status"] == "OUT_OF_RANGE"
    assert alerts[0]["last_temperature_c"] == 8.0


def test_list_alerts_no_data(storage_id):
    """Test du statut NO_DATA."""
    response = client.get("/api/stock/cold-chain/alerts")
    assert response.status_code == 200
    alerts = response.json()
    assert len(alerts) == 1
    assert alerts[0]["status"] == "NO_DATA"
    assert alerts[0]["last_temperature_c"] is None
