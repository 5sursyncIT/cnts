"""Correction et validation biologique des analyses."""

from fastapi.testclient import TestClient


def test_validation_puis_correction_exige_revalidation(client: TestClient, don_id: str):
    a = client.post("/api/analyses", json={"don_id": don_id, "type_test": "VIH", "resultat": "NEGATIF"}).json()

    v = client.post(f"/api/analyses/{a['id']}/valider")
    assert v.status_code == 200 and v.json()["validateur_id"]
    assert client.post(f"/api/analyses/{a['id']}/valider").status_code == 409

    c = client.patch(f"/api/analyses/{a['id']}", json={"resultat": "POSITIF", "note": "Contrôle répété"})
    assert c.status_code == 200
    assert c.json()["resultat"] == "POSITIF" and c.json()["validateur_id"] is None


def test_resultat_en_attente_non_validable(client: TestClient, don_id: str):
    a = client.post("/api/analyses", json={"don_id": don_id, "type_test": "VHB", "resultat": "EN_ATTENTE"}).json()
    assert client.post(f"/api/analyses/{a['id']}/valider").status_code == 409
