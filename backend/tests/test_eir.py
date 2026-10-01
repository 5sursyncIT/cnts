"""EIR : déclaration rattachée à un acte transfusionnel, valeurs contrôlées."""

import datetime as dt

from tests.test_backoffice_business_rules import _hospital, _pocket, _release


def _acte(client, don_id):
    _release(client, don_id)
    pocket = _pocket(client, don_id)
    hospital_id = _hospital(client)
    receiver = client.post("/api/receveurs", json={"nom": "Patient EIR", "groupe_sanguin": "O+"}).json()
    command = client.post("/api/commandes", json={
        "hopital_id": hospital_id, "lignes": [{"type_produit": "ST", "quantite": 1}],
    }).json()
    client.post(f"/api/commandes/{command['id']}/valider", json={})
    client.post(f"/api/commandes/{command['id']}/affecter", json={
        "affectations": [{"ligne_commande_id": command["lignes"][0]["id"],
                          "receveur_id": receiver["id"], "quantite": 1}],
    })
    client.post(f"/api/commandes/{command['id']}/servir", json={})
    acte = client.post("/api/hemovigilance/transfusions", json={
        "poche_id": pocket["id"],
        "date_transfusion": dt.datetime.now(dt.timezone.utc).isoformat(),
    })
    assert acte.status_code == 201, acte.text
    return acte.json(), pocket, receiver


def test_declaration_eir_deduit_poche_et_receveur(client, don_id):
    acte, pocket, receiver = _acte(client, don_id)
    r = client.post("/api/eir", json={
        "acte_transfusionnel_id": acte["id"], "type_eir": "REACTION_FEBRILE",
        "gravite": "GRADE_1", "imputabilite": "POSSIBLE", "symptomes": "Fièvre 38,5 °C",
    })
    assert r.status_code == 201, r.text
    body = r.json()
    assert body["poche_id"] == pocket["id"] and body["receveur_id"] == receiver["id"]
    assert body["declarant_id"] is not None and body["date_declaration"] is not None

    assert client.post(f"/api/eir/{body['id']}/cloturer").json()["statut_investigation"] == "CLOTUREE"


def test_valeurs_invalides_refusees(client, don_id):
    acte, _pocket_, _receiver = _acte(client, don_id)
    r = client.post("/api/eir", json={
        "acte_transfusionnel_id": acte["id"], "type_eir": "INVENTE",
        "gravite": "GRADE_9", "imputabilite": "POSSIBLE",
    })
    assert r.status_code == 422
