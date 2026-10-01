"""Collectes : création sans code, cycle de vie et pointage des inscriptions."""

from fastapi.testclient import TestClient

CAMPAGNE = {
    "nom": "Collecte UCAD",
    "type_campagne": "UNIVERSITE",
    "lieu": "UCAD",
    "date_debut": "2026-10-10T08:00:00Z",
    "date_fin": "2026-10-10T17:00:00Z",
    "objectif_dons": 2,
}


def test_code_genere_si_absent(client: TestClient):
    r = client.post("/api/collectes", json=CAMPAGNE)
    assert r.status_code == 201, r.text
    assert r.json()["code"].startswith("COL-20261010-")


def test_dates_incoherentes_refusees(client: TestClient):
    r = client.post("/api/collectes", json={**CAMPAGNE, "date_fin": "2026-10-09T08:00:00Z"})
    assert r.status_code == 422


def test_cycle_de_vie_et_bilan(client: TestClient):
    cid = client.post("/api/collectes", json=CAMPAGNE).json()["id"]

    ins = client.post(
        f"/api/collectes/{cid}/inscriptions", json={"campagne_id": cid, "nom": "Awa Ndiaye"}
    ).json()
    r = client.patch(f"/api/collectes/{cid}/inscriptions/{ins['id']}", json={"statut": "PRELEVE"})
    assert r.status_code == 200 and r.json()["statut"] == "PRELEVE"

    assert client.post(f"/api/collectes/{cid}/demarrer").json()["statut"] == "EN_COURS"
    assert client.post(f"/api/collectes/{cid}/annuler").status_code == 409
    assert client.post(f"/api/collectes/{cid}/terminer").json()["statut"] == "TERMINEE"

    bilan = client.get(f"/api/collectes/{cid}/bilan").json()
    assert bilan["preleves"] == 1 and bilan["taux_realisation"] == 50.0


def test_annulation_depuis_planifiee(client: TestClient):
    cid = client.post("/api/collectes", json=CAMPAGNE).json()["id"]
    assert client.post(f"/api/collectes/{cid}/annuler").json()["statut"] == "ANNULEE"
