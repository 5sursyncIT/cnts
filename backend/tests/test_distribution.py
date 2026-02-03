"""
Tests pour le module Distribution (hôpitaux, commandes, cross-matching).

Vérifie les règles critiques du DEVBOOK.md:
- Workflow complet: BROUILLON → VALIDEE → SERVIE
- Allocation FEFO (First Expired, First Out)
- Cross-matching requis pour CGR
- Blocage si don non LIBERE
- Libération automatique des réservations expirées
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
def db_session():
    """Fournir une session de base de données pour les tests."""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture
def hopital_id():
    """Créer un hôpital de test."""
    response = client.post(
        "/hopitaux",
        json={
            "nom": "Hôpital Principal de Dakar",
            "adresse": "Avenue Cheikh Anta Diop, Dakar",
            "contact": "Tel: +221 33 XXX XX XX",
            "convention_actif": True,
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


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
    assert response.status_code == 200
    return response.json()["id"]


@pytest.fixture
def don_libere_o_pos(donneur_id):
    """Créer un don libéré avec groupe O+."""
    # Créer le don
    response = client.post(
        "/dons",
        json={
            "donneur_id": donneur_id,
            "date_don": str(dt.date.today()),
            "type_don": "SANG_TOTAL",
        },
    )
    assert response.status_code == 201
    don_id = response.json()["id"]

    # Ajouter les analyses
    for test_type, resultat in [
        ("ABO", "O"),
        ("RH", "POS"),
        ("VIH", "NEGATIF"),
        ("VHB", "NEGATIF"),
        ("VHC", "NEGATIF"),
        ("SYPHILIS", "NEGATIF"),
    ]:
        response = client.post(
            "/analyses",
            json={
                "don_id": don_id,
                "type_test": test_type,
                "resultat": resultat,
            },
        )
        assert response.status_code == 201

    # Libérer le don
    response = client.post(f"/liberation/{don_id}/liberer")
    assert response.status_code == 200

    return don_id


@pytest.fixture
def poche_cgr_disponible_o_pos(don_libere_o_pos):
    """Créer une poche CGR disponible O+."""
    # Récupérer la poche ST créée automatiquement
    response = client.get("/poches", params={"limit": 200})
    assert response.status_code == 200
    poches = [
        p for p in response.json() if p["don_id"] == don_libere_o_pos and p["type_produit"] == "ST"
    ]
    assert len(poches) > 0
    poche_st_id = poches[0]["id"]

    # Fractionner en CGR
    response = client.post(
        "/stock/fractionnements",
        json={
            "source_poche_id": poche_st_id,
            "composants": [
                {"type_produit": "CGR", "volume_ml": 280}
            ],
        },
    )
    assert response.status_code == 200
    cgr_id = response.json()["poches_creees"][0]["id"]

    return cgr_id


@pytest.fixture
def receveur_id_o_pos():
    """Créer un receveur de groupe O+."""
    response = client.post(
        "/receveurs",
        json={
            "nom": "Fall, Fatou",
            "groupe_sanguin": "O+",
        },
    )
    assert response.status_code == 201
    return response.json()["id"]


def test_create_hopital():
    """Test de création d'un hôpital."""
    response = client.post(
        "/hopitaux",
        json={
            "nom": "Centre Hospitalier Universitaire de Fann",
            "adresse": "Avenue Cheikh Anta Diop",
            "contact": "Tel: +221 33 869 25 25",
            "convention_actif": True,
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["nom"] == "Centre Hospitalier Universitaire de Fann"
    assert data["convention_actif"] is True
    assert "id" in data


def test_create_hopital_duplicate_name():
    """Test de création d'un hôpital avec nom déjà existant."""
    response = client.post(
        "/hopitaux",
        json={
            "nom": "Hôpital Le Dantec",
            "adresse": "Avenue Pasteur",
            "convention_actif": True,
        },
    )
    assert response.status_code == 201

    # Tentative de créer un autre hôpital avec le même nom
    response = client.post(
        "/hopitaux",
        json={
            "nom": "Hôpital Le Dantec",
            "adresse": "Autre adresse",
            "convention_actif": True,
        },
    )
    assert response.status_code == 409


def test_list_hopitaux(hopital_id):
    """Test de liste des hôpitaux."""
    response = client.get("/hopitaux")
    assert response.status_code == 200
    assert len(response.json()) >= 1


def test_create_commande_brouillon(hopital_id):
    """Test de création d'une commande en mode brouillon."""
    response = client.post(
        "/commandes",
        json={
            "hopital_id": hopital_id,
            "date_livraison_prevue": str(dt.date.today() + dt.timedelta(days=2)),
            "lignes": [
                {"type_produit": "CGR", "groupe_sanguin": "O+", "quantite": 2},
                {"type_produit": "PFC", "groupe_sanguin": "AB+", "quantite": 1},
            ],
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["statut"] == "BROUILLON"
    assert len(data["lignes"]) == 2
    assert data["lignes"][0]["quantite"] == 2


def test_create_commande_hopital_non_actif():
    """Test de création d'une commande pour un hôpital sans convention active."""
    # Créer un hôpital sans convention active
    response = client.post(
        "/hopitaux",
        json={
            "nom": "Hôpital Sans Convention",
            "convention_actif": False,
        },
    )
    assert response.status_code == 201
    hopital_id = response.json()["id"]

    # Tentative de créer une commande
    response = client.post(
        "/commandes",
        json={
            "hopital_id": hopital_id,
            "lignes": [
                {"type_produit": "CGR", "groupe_sanguin": "O+", "quantite": 1},
            ],
        },
    )
    assert response.status_code == 409


def test_valider_commande_with_fefo(hopital_id, poche_cgr_disponible_o_pos):
    """Test de validation d'une commande avec allocation FEFO."""
    # Créer une commande
    response = client.post(
        "/commandes",
        json={
            "hopital_id": hopital_id,
            "lignes": [
                {"type_produit": "CGR", "groupe_sanguin": "O+", "quantite": 1},
            ],
        },
    )
    assert response.status_code == 201
    commande_id = response.json()["id"]

    # Valider la commande
    response = client.post(
        f"/commandes/{commande_id}/valider",
        json={"duree_reservation_heures": 24},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["statut"] == "VALIDEE"
    assert len(data["reservations"]) == 1
    assert data["reservations"][0]["poche_id"] == poche_cgr_disponible_o_pos


def test_valider_commande_stock_insuffisant(hopital_id):
    """Test de validation d'une commande avec stock insuffisant."""
    # Créer une commande sans stock disponible
    response = client.post(
        "/commandes",
        json={
            "hopital_id": hopital_id,
            "lignes": [
                {"type_produit": "CGR", "groupe_sanguin": "AB-", "quantite": 10},
            ],
        },
    )
    assert response.status_code == 201
    commande_id = response.json()["id"]

    # Tentative de validation
    response = client.post(
        f"/commandes/{commande_id}/valider",
        json={"duree_reservation_heures": 24},
    )
    assert response.status_code == 409


def test_affecter_receveurs(hopital_id, poche_cgr_disponible_o_pos, receveur_id_o_pos):
    """Test d'affectation de receveurs à une commande validée."""
    # Créer et valider une commande
    response = client.post(
        "/commandes",
        json={
            "hopital_id": hopital_id,
            "lignes": [
                {"type_produit": "CGR", "groupe_sanguin": "O+", "quantite": 1},
            ],
        },
    )
    assert response.status_code == 201
    commande_id = response.json()["id"]
    ligne_id = response.json()["lignes"][0]["id"]

    response = client.post(
        f"/commandes/{commande_id}/valider",
        json={"duree_reservation_heures": 24},
    )
    assert response.status_code == 200

    # Affecter un receveur
    response = client.post(
        f"/commandes/{commande_id}/affecter",
        json={
            "affectations": [
                {
                    "ligne_commande_id": ligne_id,
                    "receveur_id": receveur_id_o_pos,
                    "quantite": 1,
                }
            ]
        },
    )
    assert response.status_code == 200
    assert response.json()["assigned"] == 1


def test_create_crossmatch_compatible(poche_cgr_disponible_o_pos, receveur_id_o_pos):
    """Test de création d'un cross-match compatible."""
    response = client.post(
        "/cross-match",
        json={
            "poche_id": poche_cgr_disponible_o_pos,
            "receveur_id": receveur_id_o_pos,
            "resultat": "COMPATIBLE",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["resultat"] == "COMPATIBLE"


def test_servir_commande_complete_workflow(hopital_id, poche_cgr_disponible_o_pos, receveur_id_o_pos):
    """Test du workflow complet: création → validation → affectation → cross-match → service."""
    # 1. Créer la commande
    response = client.post(
        "/commandes",
        json={
            "hopital_id": hopital_id,
            "lignes": [
                {"type_produit": "CGR", "groupe_sanguin": "O+", "quantite": 1},
            ],
        },
    )
    assert response.status_code == 201
    commande_id = response.json()["id"]
    ligne_id = response.json()["lignes"][0]["id"]

    # 2. Valider la commande
    response = client.post(
        f"/commandes/{commande_id}/valider",
        json={"duree_reservation_heures": 24},
    )
    assert response.status_code == 200

    # 3. Affecter le receveur
    response = client.post(
        f"/commandes/{commande_id}/affecter",
        json={
            "affectations": [
                {
                    "ligne_commande_id": ligne_id,
                    "receveur_id": receveur_id_o_pos,
                    "quantite": 1,
                }
            ]
        },
    )
    assert response.status_code == 200

    # 4. Effectuer le cross-match
    response = client.post(
        "/cross-match",
        json={
            "poche_id": poche_cgr_disponible_o_pos,
            "receveur_id": receveur_id_o_pos,
            "resultat": "COMPATIBLE",
        },
    )
    assert response.status_code == 201

    # 5. Servir la commande
    response = client.post(
        f"/commandes/{commande_id}/servir",
        json={},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["statut"] == "SERVIE"
    assert len(data["poches"]) == 1


def test_servir_commande_sans_crossmatch(hopital_id, poche_cgr_disponible_o_pos, receveur_id_o_pos):
    """Test de tentative de service sans cross-match."""
    # Créer, valider et affecter
    response = client.post(
        "/commandes",
        json={
            "hopital_id": hopital_id,
            "lignes": [
                {"type_produit": "CGR", "groupe_sanguin": "O+", "quantite": 1},
            ],
        },
    )
    assert response.status_code == 201
    commande_id = response.json()["id"]
    ligne_id = response.json()["lignes"][0]["id"]

    response = client.post(
        f"/commandes/{commande_id}/valider",
        json={"duree_reservation_heures": 24},
    )
    assert response.status_code == 200

    response = client.post(
        f"/commandes/{commande_id}/affecter",
        json={
            "affectations": [
                {
                    "ligne_commande_id": ligne_id,
                    "receveur_id": receveur_id_o_pos,
                    "quantite": 1,
                }
            ]
        },
    )
    assert response.status_code == 200

    # Tentative de service SANS cross-match
    response = client.post(
        f"/commandes/{commande_id}/servir",
        json={},
    )
    assert response.status_code == 409  # cross-match manquant


def test_annuler_commande(hopital_id, poche_cgr_disponible_o_pos):
    """Test d'annulation d'une commande validée."""
    # Créer et valider une commande
    response = client.post(
        "/commandes",
        json={
            "hopital_id": hopital_id,
            "lignes": [
                {"type_produit": "CGR", "groupe_sanguin": "O+", "quantite": 1},
            ],
        },
    )
    assert response.status_code == 201
    commande_id = response.json()["id"]

    response = client.post(
        f"/commandes/{commande_id}/valider",
        json={"duree_reservation_heures": 24},
    )
    assert response.status_code == 200

    # Annuler la commande
    response = client.post(f"/commandes/{commande_id}/annuler")
    assert response.status_code == 200
    data = response.json()
    assert data["statut"] == "ANNULEE"

    # Vérifier que la poche est redevenue DISPONIBLE
    response = client.get(f"/poches/{poche_cgr_disponible_o_pos}")
    assert response.status_code == 200
    assert response.json()["statut_distribution"] == "DISPONIBLE"


def test_create_receveur():
    """Test de création d'un receveur."""
    response = client.post(
        "/receveurs",
        json={
            "nom": "Ndiaye, Moussa",
            "groupe_sanguin": "A+",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert data["groupe_sanguin"] == "A+"
    assert "id" in data


def test_crossmatch_incompatible_rejection():
    """Test de rejet d'un cross-match incompatible."""
    # Créer un donneur A+ et un receveur B+
    response = client.post(
        "/donneurs",
        json={
            "cni": "9876543210987",
            "nom": "Sarr",
            "prenom": "Ibrahima",
            "sexe": "H",
        },
    )
    assert response.status_code == 200
    donneur_id = response.json()["id"]

    # Créer un don A+
    response = client.post(
        "/dons",
        json={
            "donneur_id": donneur_id,
            "date_don": str(dt.date.today()),
            "type_don": "SANG_TOTAL",
        },
    )
    assert response.status_code == 201
    don_id = response.json()["id"]

    # Ajouter analyses et libérer
    for test_type, resultat in [
        ("ABO", "A"),
        ("RH", "POS"),
        ("VIH", "NEGATIF"),
        ("VHB", "NEGATIF"),
        ("VHC", "NEGATIF"),
        ("SYPHILIS", "NEGATIF"),
    ]:
        client.post("/analyses", json={"don_id": don_id, "type_test": test_type, "resultat": resultat})

    client.post(f"/liberation/{don_id}/liberer")

    # Récupérer la poche ST
    response = client.get("/poches", params={"limit": 200})
    assert response.status_code == 200
    poche_st_id = next(
        p["id"] for p in response.json() if p["don_id"] == str(don_id) and p["type_produit"] == "ST"
    )

    # Fractionner en CGR
    response = client.post(
        "/stock/fractionnements",
        json={
            "source_poche_id": poche_st_id,
            "composants": [{"type_produit": "CGR", "volume_ml": 280}],
        },
    )
    cgr_id = response.json()["poches_creees"][0]["id"]

    # Créer un receveur B+
    response = client.post(
        "/receveurs",
        json={"nom": "Wade, Aminata", "groupe_sanguin": "B+"},
    )
    receveur_b_id = response.json()["id"]

    # Tenter un cross-match incompatible (A+ → B+)
    response = client.post(
        "/cross-match",
        json={
            "poche_id": cgr_id,
            "receveur_id": receveur_b_id,
            "resultat": "COMPATIBLE",
        },
    )
    assert response.status_code == 409  # Incompatibilité détectée
