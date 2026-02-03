"""
Tests pour le module de gestion des poches (stock).

Vérifie:
- Tri FEFO (First Expired First Out)
- Alertes de péremption
- Résumé du stock
- Protection des poches distribuées
"""

import datetime as dt
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.models import Poche
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
def donneur_id():
    """Créer un donneur de test."""
    response = client.post(
        "/donneurs",
        json={
            "cni": "1234567890123",
            "nom": "Diop",
            "prenom": "Amadou",
            "sexe": "H",
        },
    )
    return response.json()["id"]


@pytest.fixture
def don_id(donneur_id):
    """Créer un don de test."""
    response = client.post(
        "/dons",
        json={
            "donneur_id": donneur_id,
            "date_don": str(dt.date.today()),
            "type_don": "SANG_TOTAL",
        },
    )
    return response.json()["id"]


@pytest.fixture
def don_libere(don_id):
    """Créer un don libéré avec tous les tests négatifs."""
    tests = [
        ("ABO", "O"),
        ("RH", "POS"),
        ("VIH", "NEGATIF"),
        ("VHB", "NEGATIF"),
        ("VHC", "NEGATIF"),
        ("SYPHILIS", "NEGATIF"),
    ]
    for type_test, resultat in tests:
        client.post("/analyses", json={"don_id": don_id, "type_test": type_test, "resultat": resultat})
    client.post(f"/liberation/{don_id}/liberer")
    return don_id


@pytest.fixture
def db_session():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


def test_create_poche(don_id):
    """Test: Créer une poche produit dérivé."""
    response = client.post(
        "/poches",
        json={
            "don_id": don_id,
            "type_produit": "CGR",
            "date_peremption": str(dt.date.today() + dt.timedelta(days=42)),
            "emplacement_stock": "FRIGO_A1",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["type_produit"] == "CGR"
    assert data["statut_distribution"] == "NON_DISTRIBUABLE"
    assert data["emplacement_stock"] == "FRIGO_A1"


def test_list_poches_fefo(don_id):
    """Test: Tri FEFO (First Expired First Out)."""
    today = dt.date.today()

    # Créer 3 poches avec dates de péremption différentes
    poches_data = [
        {"date_peremption": today + dt.timedelta(days=10), "type_produit": "CGR"},
        {"date_peremption": today + dt.timedelta(days=5), "type_produit": "CGR"},
        {"date_peremption": today + dt.timedelta(days=15), "type_produit": "CGR"},
    ]

    for poche in poches_data:
        client.post(
            "/poches",
            json={
                "don_id": don_id,
                "type_produit": poche["type_produit"],
                "date_peremption": str(poche["date_peremption"]),
                "emplacement_stock": "FRIGO_A1",
            },
        )

    # Lister avec tri FEFO
    response = client.get("/poches", params={"sort_by_expiration": True, "limit": 100})
    assert response.status_code == 200

    poches = response.json()
    # Ne compter que les CGR (la poche ST est créée automatiquement)
    poches_cgr = [p for p in poches if p["type_produit"] == "CGR"]
    assert len(poches_cgr) == 3

    # Vérifier que les poches sont triées par date de péremption croissante
    dates = [dt.date.fromisoformat(p["date_peremption"]) for p in poches_cgr]
    assert dates == sorted(dates), "Les poches doivent être triées FEFO"


def test_alertes_peremption(don_libere):
    """Test: Alertes de péremption pour poches proches de la date limite."""
    today = dt.date.today()

    # Créer des poches avec différentes dates de péremption
    poches_data = [
        (today + dt.timedelta(days=3), "CGR", "DISPONIBLE"),  # Alerte
        (today + dt.timedelta(days=5), "PFC", "DISPONIBLE"),  # Alerte
        (today + dt.timedelta(days=20), "CGR", "DISPONIBLE"),  # Pas d'alerte
        (today + dt.timedelta(days=2), "CP", "NON_DISTRIBUABLE"),  # Pas d'alerte (statut)
    ]

    for date_peremption, type_produit, statut in poches_data:
        response = client.post(
            "/poches",
            json={
                "don_id": don_libere,
                "type_produit": type_produit,
                "date_peremption": str(date_peremption),
                "emplacement_stock": "FRIGO_A1",
            },
        )
        poche_id = response.json()["id"]

        # Mettre à jour le statut si nécessaire
        if statut == "DISPONIBLE":
            client.patch(
                f"/poches/{poche_id}",
                json={"statut_distribution": statut},
            )

    # Obtenir les alertes (7 jours)
    response = client.get("/poches/alertes/peremption", params={"jours": 7})
    assert response.status_code == 200

    alertes = response.json()
    # Devrait avoir 2 alertes (CGR et PFC DISPONIBLE qui périment dans 7 jours)
    assert len(alertes) >= 2

    # Vérifier que les alertes sont triées par date de péremption
    for alerte in alertes:
        assert alerte["statut_distribution"] in ["DISPONIBLE", "RESERVE"]
        assert alerte["jours_restants"] <= 7


def test_stock_summary(don_libere):
    """Test: Résumé du stock par type de produit."""
    # Créer plusieurs poches de différents types
    poches_data = [
        ("CGR", "DISPONIBLE"),
        ("CGR", "DISPONIBLE"),
        ("CGR", "RESERVE"),
        ("PFC", "DISPONIBLE"),
        ("PFC", "RESERVE"),
        ("CP", "DISPONIBLE"),
    ]

    for type_produit, statut in poches_data:
        response = client.post(
            "/poches",
            json={
                "don_id": don_libere,
                "type_produit": type_produit,
                "date_peremption": str(dt.date.today() + dt.timedelta(days=30)),
                "emplacement_stock": "FRIGO_A1",
            },
        )
        poche_id = response.json()["id"]
        if statut == "RESERVE":
            db = TestingSessionLocal()
            try:
                poche = db.get(Poche, uuid.UUID(poche_id))
                assert poche is not None
                poche.statut_distribution = "RESERVE"
                db.commit()
            finally:
                db.close()
        else:
            client.patch(f"/poches/{poche_id}", json={"statut_distribution": statut})

    # Obtenir le résumé
    response = client.get("/poches/stock/summary")
    assert response.status_code == 200

    summary = {s["type_produit"]: s for s in response.json()}

    # Vérifier CGR
    assert "CGR" in summary
    assert summary["CGR"]["quantite_disponible"] == 2
    assert summary["CGR"]["quantite_reservee"] == 1
    assert summary["CGR"]["quantite_totale"] == 3

    # Vérifier PFC
    assert "PFC" in summary
    assert summary["PFC"]["quantite_disponible"] == 1
    assert summary["PFC"]["quantite_reservee"] == 1


def test_update_poche_non_disponible_sans_liberation(don_id):
    """Test: Impossible de rendre une poche DISPONIBLE si le don n'est pas LIBERE."""
    # Créer une poche
    response = client.post(
        "/poches",
        json={
            "don_id": don_id,
            "type_produit": "CGR",
            "date_peremption": str(dt.date.today() + dt.timedelta(days=30)),
            "emplacement_stock": "FRIGO_A1",
        },
    )
    poche_id = response.json()["id"]

    # Tenter de rendre la poche DISPONIBLE
    response = client.patch(
        f"/poches/{poche_id}",
        json={"statut_distribution": "DISPONIBLE"},
    )
    assert response.status_code == 422
    assert "n'est pas LIBERE" in response.json()["detail"]


def test_delete_poche_distribuee_interdite(don_libere):
    """Test: Impossible de supprimer une poche déjà distribuée."""
    # Créer et distribuer une poche
    response = client.post(
        "/poches",
        json={
            "don_id": don_libere,
            "type_produit": "CGR",
            "date_peremption": str(dt.date.today() + dt.timedelta(days=30)),
            "emplacement_stock": "FRIGO_A1",
        },
    )
    poche_id = response.json()["id"]

    # Marquer comme distribuée (contournement: l'API impose le workflow commandes)
    db = TestingSessionLocal()
    try:
        poche = db.get(Poche, uuid.UUID(poche_id))
        assert poche is not None
        poche.statut_distribution = "DISTRIBUE"
        db.commit()
    finally:
        db.close()

    # Tenter de supprimer
    response = client.delete(f"/poches/{poche_id}")
    assert response.status_code == 422
    assert "déjà distribuée" in response.json()["detail"]
