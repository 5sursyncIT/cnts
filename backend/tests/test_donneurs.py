"""Tests du module Donneurs : sécurité, confidentialité, éligibilité, soft-delete."""

import datetime as dt

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def donneur(client: TestClient) -> dict:
    resp = client.post(
        "/api/donneurs",
        json={"cni": "1111111111111", "nom": "Diallo", "prenom": "Awa", "sexe": "F"},
    )
    assert resp.status_code == 200, resp.text
    return resp.json()


def test_cni_hash_not_exposed(donneur: dict):
    # Le hash du CNI ne doit jamais sortir de l'API (corrélation / dictionnaire).
    assert "cni_hash" not in donneur
    assert "cni" not in donneur


def test_duplicate_cni_returns_409_not_existing_record(client: TestClient, donneur: dict):
    # Pas d'oracle d'existence : on renvoie 409, jamais la fiche existante.
    resp = client.post(
        "/api/donneurs",
        json={"cni": "1111111111111", "nom": "X", "prenom": "Y", "sexe": "H"},
    )
    assert resp.status_code == 409
    assert "id" not in resp.json()


def test_eligibilite_premier_don(client: TestClient, donneur: dict):
    resp = client.get(f"/api/donneurs/{donneur['id']}/eligibilite")
    assert resp.status_code == 200
    body = resp.json()
    assert body["eligible"] is True
    assert "Premier don" in body["raison"]


def test_eligibilite_mineur(client: TestClient):
    minor = client.post(
        "/api/donneurs",
        json={
            "cni": "2222222222222",
            "nom": "Jeune",
            "prenom": "Petit",
            "sexe": "H",
            "date_naissance": "2015-01-01",
        },
    ).json()
    body = client.get(f"/api/donneurs/{minor['id']}/eligibilite").json()
    assert body["eligible"] is False
    assert body["age"] is not None and body["age"] < 18


def test_don_enforce_eligibilite_et_override(client: TestClient, donneur: dict):
    did = donneur["id"]
    today = str(dt.date.today())
    # 1er don : éligible.
    assert client.post(
        "/api/dons", json={"donneur_id": did, "date_don": today, "type_don": "SANG_TOTAL"}
    ).status_code == 201
    # 2e don le même jour : délai non respecté -> 409.
    blocked = client.post(
        "/api/dons", json={"donneur_id": did, "date_don": today, "type_don": "SANG_TOTAL"}
    )
    assert blocked.status_code == 409
    # Override médical explicite -> accepté.
    assert client.post(
        "/api/dons",
        json={
            "donneur_id": did,
            "date_don": today,
            "type_don": "SANG_TOTAL",
            "ignorer_eligibilite": True,
        },
    ).status_code == 201


def test_dernier_don_ne_regresse_pas(client: TestClient, donneur: dict):
    did = donneur["id"]
    today = dt.date.today()
    client.post(
        "/api/dons",
        json={"donneur_id": did, "date_don": str(today), "type_don": "SANG_TOTAL"},
    )
    # Saisie rétroactive d'un don plus ancien : ne doit pas écraser dernier_don.
    client.post(
        "/api/dons",
        json={
            "donneur_id": did,
            "date_don": "2020-01-01",
            "type_don": "SANG_TOTAL",
            "ignorer_eligibilite": True,
        },
    )
    fiche = client.get(f"/api/donneurs/{did}").json()
    assert fiche["dernier_don"] == str(today)


def test_soft_delete_masque_mais_conserve_les_dons(client: TestClient, donneur: dict):
    did = donneur["id"]
    client.post(
        "/api/dons",
        json={"donneur_id": did, "date_don": str(dt.date.today()), "type_don": "SANG_TOTAL"},
    )
    dons_avant = client.get("/api/dons", params={"donneur_id": did}).json()
    assert len(dons_avant) >= 1

    assert client.delete(f"/api/donneurs/{did}").status_code == 204
    # Masqué des accès directs et des listes...
    assert client.get(f"/api/donneurs/{did}").status_code == 404
    assert did not in [d["id"] for d in client.get("/api/donneurs").json()]
    # ...mais les dons restent traçables.
    dons_apres = client.get("/api/dons", params={"donneur_id": did}).json()
    assert len(dons_apres) == len(dons_avant)
