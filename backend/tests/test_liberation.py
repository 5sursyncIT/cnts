"""
Tests pour le module de libération biologique.

Vérifie les règles critiques du DEVBOOK.md:
- Tous les tests obligatoires doivent être effectués
- Tous les résultats doivent être NEGATIF
- Les poches ne peuvent être DISPONIBLE que si le don est LIBERE
"""

import datetime as dt

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def donneur_id(client: TestClient):
    """Créer un donneur de test."""
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
def don_id(client: TestClient, donneur_id):
    """Créer un don de test."""
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


def test_verification_liberation_tests_manquants(client: TestClient, don_id):
    """Test: La libération échoue si des tests obligatoires manquent."""
    response = client.get(f"/api/liberation/{don_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["liberable"] is False
    assert "Tests manquants" in data["raison"]
    assert data["statut_qualification"] == "EN_ATTENTE"


def test_verification_liberation_test_positif(client: TestClient, don_id):
    """Test: La libération échoue si un test est POSITIF."""
    # Créer tous les tests obligatoires
    tests = [
        ("ABO", "O"),
        ("RH", "POS"),
        ("VIH", "POSITIF"),  # Test positif
        ("VHB", "NEGATIF"),
        ("VHC", "NEGATIF"),
        ("SYPHILIS", "NEGATIF"),
    ]

    for type_test, resultat in tests:
        response = client.post(
            "/api/analyses",
            json={
                "don_id": don_id,
                "type_test": type_test,
                "resultat": resultat,
            },
        )
        assert response.status_code == 201

    # Vérifier que la libération est impossible
    response = client.get(f"/api/liberation/{don_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["liberable"] is False
    assert "VIH=POSITIF" in data["raison"]


def test_verification_liberation_test_en_attente(client: TestClient, don_id):
    """Test: La libération échoue si un test est EN_ATTENTE."""
    # Créer tous les tests obligatoires
    tests = [
        ("ABO", "O"),
        ("RH", "POS"),
        ("VIH", "NEGATIF"),
        ("VHB", "EN_ATTENTE"),  # Test en attente
        ("VHC", "NEGATIF"),
        ("SYPHILIS", "NEGATIF"),
    ]

    for type_test, resultat in tests:
        response = client.post(
            "/api/analyses",
            json={
                "don_id": don_id,
                "type_test": type_test,
                "resultat": resultat,
            },
        )
        assert response.status_code == 201

    # Vérifier que la libération est impossible
    response = client.get(f"/api/liberation/{don_id}")
    assert response.status_code == 200

    data = response.json()
    assert data["liberable"] is False
    assert "VHB=EN_ATTENTE" in data["raison"]


def test_liberation_biologique_succes(client: TestClient, don_id):
    """Test: La libération réussit si tous les tests sont NEGATIF."""
    # Créer tous les tests obligatoires avec résultats négatifs
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

    # Vérifier que le don est libérable
    response = client.get(f"/api/liberation/{don_id}")
    assert response.status_code == 200
    assert response.json()["liberable"] is True

    # Effectuer la libération
    response = client.post(f"/api/liberation/{don_id}/liberer")
    assert response.status_code == 200

    data = response.json()
    assert data["liberable"] is True
    assert data["statut_qualification"] == "LIBERE"
    assert data["raison"] is None


def test_liberation_met_a_jour_statut_poches(client: TestClient, don_id, db_session):
    """Test: La libération met à jour le statut des poches à DISPONIBLE."""
    # Créer tous les tests obligatoires
    tests = [
        ("ABO", "O"),
        ("RH", "POS"),
        ("VIH", "NEGATIF"),
        ("VHB", "NEGATIF"),
        ("VHC", "NEGATIF"),
        ("SYPHILIS", "NEGATIF"),
    ]
    for type_test, resultat in tests:
        client.post(
            "/api/analyses",
            json={"don_id": don_id, "type_test": type_test, "resultat": resultat},
        )

    # Vérifier qu'une poche ST a été créée automatiquement
    response = client.get("/api/poches", params={"limit": 100})
    assert response.status_code == 200
    poches_avant = response.json()
    assert len(poches_avant) > 0
    assert poches_avant[0]["statut_distribution"] == "NON_DISTRIBUABLE"

    # Effectuer la libération
    client.post(f"/api/liberation/{don_id}/liberer")

    # Vérifier que le statut de la poche a été mis à jour
    response = client.get("/api/poches", params={"limit": 100})
    poches_apres = response.json()
    assert poches_apres[0]["statut_distribution"] == "DISPONIBLE"


def test_liberer_don_non_liberable_echoue(client: TestClient, don_id):
    """Test: Impossible de libérer un don qui n'est pas libérable."""
    # Ne créer qu'un seul test (incomplet)
    client.post(
        "/api/analyses",
        json={
            "don_id": don_id,
            "type_test": "ABO",
            "resultat": "O",
        },
    )

    # Tenter la libération
    response = client.post(f"/api/liberation/{don_id}/liberer")
    assert response.status_code == 422
    assert "Don non libérable" in response.json()["detail"]


def test_liberer_don_deja_libere_idempotent(client: TestClient, don_id):
    """Test: Libérer un don déjà libéré est idempotent."""
    # Créer tous les tests
    tests = [
        ("ABO", "O"),
        ("RH", "POS"),
        ("VIH", "NEGATIF"),
        ("VHB", "NEGATIF"),
        ("VHC", "NEGATIF"),
        ("SYPHILIS", "NEGATIF"),
    ]
    for type_test, resultat in tests:
        client.post(
            "/api/analyses",
            json={"don_id": don_id, "type_test": type_test, "resultat": resultat},
        )

    # Première libération
    response1 = client.post(f"/api/liberation/{don_id}/liberer")
    assert response1.status_code == 200
    assert response1.json()["statut_qualification"] == "LIBERE"

    # Deuxième libération (idempotente)
    response2 = client.post(f"/api/liberation/{don_id}/liberer")
    assert response2.status_code == 200
    assert response2.json()["statut_qualification"] == "LIBERE"
