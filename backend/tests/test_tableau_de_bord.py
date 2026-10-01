"""Synthèse du tableau de bord : chiffres réels issus de la base."""

from fastapi.testclient import TestClient


def test_tableau_de_bord_vide(client: TestClient):
    r = client.get("/api/tableau-de-bord")
    assert r.status_code == 200
    body = r.json()
    assert body["kpis"] == {
        "donneurs_total": 0,
        "dons_30j": 0,
        "poches_disponibles": 0,
        "poches_peremption_proche": 0,
        "commandes_en_cours": 0,
    }
    assert body["stock"] == [] and body["commandes_recentes"] == []


def test_tableau_de_bord_compte_donneurs_et_dons(client: TestClient, don_id: str):
    kpis = client.get("/api/tableau-de-bord").json()["kpis"]
    assert kpis["donneurs_total"] == 1
    assert kpis["dons_30j"] == 1
