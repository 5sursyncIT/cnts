"""
Shared test fixtures for the CNTS backend test suite.

Provides a reusable SQLite in-memory database setup, test client,
and common domain fixtures (donneur, don, analyses).
"""

import datetime as dt
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.session import get_db
from app.main import app

# ---------- Database setup ----------

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


# ---------- Fixtures ----------

@pytest.fixture(autouse=True)
def setup_database():
    """Create tables before each test and drop them after."""
    previous = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if previous is None:
        app.dependency_overrides.pop(get_db, None)
    else:
        app.dependency_overrides[get_db] = previous


@pytest.fixture
def client() -> TestClient:
    """Provide a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def db_session() -> Session:
    """Provide a database session for direct ORM operations."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def donneur_id(client: TestClient) -> str:
    """Create a test donor and return its ID."""
    response = client.post(
        "/api/donneurs",
        json={
            "cni": "1234567890123",
            "nom": "Diop",
            "prenom": "Amadou",
            "sexe": "H",
        },
    )
    assert response.status_code == 200
    return response.json()["id"]


@pytest.fixture
def don_id(client: TestClient, donneur_id: str) -> str:
    """Create a test donation and return its ID."""
    response = client.post(
        "/api/dons",
        json={
            "donneur_id": donneur_id,
            "date_don": str(dt.date.today()),
            "type_don": "SANG_TOTAL",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


@pytest.fixture
def don_libere(client: TestClient, don_id: str) -> str:
    """Create a fully tested and released donation. Returns don_id."""
    tests = [
        ("ABO", "O"),
        ("RH", "POS"),
        ("VIH", "NEGATIF"),
        ("VHB", "NEGATIF"),
        ("VHC", "NEGATIF"),
        ("SYPHILIS", "NEGATIF"),
    ]
    for type_test, resultat in tests:
        response = client.post(
            "/api/analyses",
            json={"don_id": don_id, "type_test": type_test, "resultat": resultat},
        )
        assert response.status_code == 201

    response = client.post(f"/api/liberation/{don_id}/liberer")
    assert response.status_code == 200
    return don_id
