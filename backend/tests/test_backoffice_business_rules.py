"""Non-régression des transitions métier sensibles du backoffice."""

import datetime as dt


def _release(client, don_id):
    analyses = {}
    for type_test, resultat in [
        ("ABO", "O"), ("RH", "POS"), ("VIH", "NEGATIF"),
        ("VHB", "NEGATIF"), ("VHC", "NEGATIF"), ("SYPHILIS", "NEGATIF"),
    ]:
        response = client.post("/api/analyses", json={
            "don_id": don_id, "type_test": type_test, "resultat": resultat,
        })
        assert response.status_code == 201, response.text
        analyses[type_test] = response.json()["id"]
    response = client.post(f"/api/liberation/{don_id}/liberer")
    assert response.status_code == 200, response.text
    return analyses


def _pocket(client, don_id):
    return next(p for p in client.get("/api/poches").json() if p["don_id"] == don_id)


def _hospital(client):
    response = client.post("/api/hopitaux", json={
        "nom": "Hôpital de vérification", "convention_actif": True,
    })
    assert response.status_code == 201, response.text
    return response.json()["id"]


def test_liberated_analyses_and_blood_group_are_immutable(client, don_id):
    analyses = _release(client, don_id)
    pocket = _pocket(client, don_id)
    assert client.patch(f"/api/analyses/{analyses['VIH']}", json={
        "resultat": "POSITIF",
    }).status_code == 409
    assert client.delete(f"/api/analyses/{analyses['VIH']}").status_code == 409
    assert client.post("/api/analyses", json={
        "don_id": don_id, "type_test": "HTLV", "resultat": "POSITIF",
    }).status_code == 409
    assert client.patch(f"/api/poches/{pocket['id']}", json={
        "groupe_sanguin": "AB-",
    }).status_code == 409


def test_recall_quarantines_reserved_pocket_and_reopens_order(client, don_id):
    _release(client, don_id)
    pocket = _pocket(client, don_id)
    hospital_id = _hospital(client)
    command = client.post("/api/commandes", json={
        "hopital_id": hospital_id,
        "lignes": [{"type_produit": "ST", "quantite": 1}],
    }).json()
    assert client.post(f"/api/commandes/{command['id']}/valider", json={}).status_code == 200
    din = client.get(f"/api/dons/{don_id}").json()["din"]
    recall = client.post("/api/hemovigilance/rappels", json={
        "type_cible": "DIN", "valeur_cible": din, "motif": "Contrôle qualité",
    })
    assert recall.status_code == 201, recall.text
    assert client.get(f"/api/poches/{pocket['id']}").json()["statut_distribution"] == "NON_DISTRIBUABLE"
    assert not any(p["id"] == pocket["id"] for p in client.get("/api/poches/disponibles").json())
    assert client.get(f"/api/commandes/{command['id']}").json()["statut"] == "BROUILLON"
    assert client.post(f"/api/commandes/{command['id']}/valider", json={}).status_code == 409
    assert client.patch(f"/api/poches/{pocket['id']}", json={
        "statut_distribution": "DISPONIBLE",
    }).status_code == 409
    rappel_id = recall.json()["id"]
    for action in ("notifier", "confirmer", "cloturer"):
        assert client.post(f"/api/hemovigilance/rappels/{rappel_id}/{action}", json={}).status_code == 200
    assert client.patch(f"/api/poches/{pocket['id']}", json={
        "statut_distribution": "DISPONIBLE",
    }).status_code == 200
    assert client.post(f"/api/commandes/{command['id']}/valider", json={}).status_code == 200


def test_lot_recall_covers_fractionated_products(client, don_id):
    _release(client, don_id)
    source = _pocket(client, don_id)
    assert client.patch(f"/api/poches/{source['id']}", json={"lot": "LOT-CONTROLE"}).status_code == 200
    fraction = client.post("/api/stock/fractionnements", json={
        "source_poche_id": source["id"],
        "composants": [{"type_produit": "CGR", "volume_ml": 280}],
    })
    assert fraction.status_code == 200, fraction.text
    derived = fraction.json()["poches_creees"][0]
    assert client.get(f"/api/poches/{derived['id']}").json()["lot"] == "LOT-CONTROLE"
    recall = client.post("/api/hemovigilance/rappels", json={
        "type_cible": "LOT", "valeur_cible": "LOT-CONTROLE",
    })
    assert recall.status_code == 201, recall.text
    assert client.get(f"/api/poches/{derived['id']}").json()["statut_distribution"] == "NON_DISTRIBUABLE"
    assert client.patch(f"/api/poches/{derived['id']}", json={"lot": "AUTRE-LOT"}).status_code == 409
    impacts = client.get(f"/api/hemovigilance/rappels/{recall.json()['id']}/impacts")
    assert impacts.status_code == 200, impacts.text
    assert derived["id"] in {row["poche_id"] for row in impacts.json()}


def test_release_never_reactivates_fractionated_source(client, don_id):
    source = _pocket(client, don_id)
    fraction = client.post("/api/stock/fractionnements", json={
        "source_poche_id": source["id"],
        "composants": [{"type_produit": "CGR", "volume_ml": 280}],
    })
    assert fraction.status_code == 200, fraction.text
    child_id = fraction.json()["poches_creees"][0]["id"]
    _release(client, don_id)
    assert client.get(f"/api/poches/{source['id']}").json()["statut_distribution"] == "NON_DISTRIBUABLE"
    assert client.get(f"/api/poches/{child_id}").json()["statut_distribution"] == "DISPONIBLE"


def test_delivery_does_not_imply_transfusion(client, don_id):
    _release(client, don_id)
    pocket = _pocket(client, don_id)
    hospital_id = _hospital(client)
    receiver = client.post("/api/receveurs", json={"nom": "Patient test", "groupe_sanguin": "O+"}).json()
    command = client.post("/api/commandes", json={
        "hopital_id": hospital_id,
        "lignes": [{"type_produit": "ST", "quantite": 1}],
    }).json()
    command_id = command["id"]
    assert client.post(f"/api/commandes/{command_id}/valider", json={}).status_code == 200
    assert client.post(f"/api/commandes/{command_id}/affecter", json={
        "affectations": [{"ligne_commande_id": command["lignes"][0]["id"],
                          "receveur_id": receiver["id"], "quantite": 1}],
    }).status_code == 200
    assert client.post(f"/api/commandes/{command_id}/servir", json={}).status_code == 200
    assert client.get("/api/hemovigilance/transfusions").json() == []
    invoice = {
        "numero": "F-LIVRAISON", "commande_id": command_id,
        "hopital_id": hospital_id, "date_facture": str(dt.date.today()),
        "lignes": [{"type_produit": "CGR", "quantite": 1, "prix_unitaire_fcfa": 1000}],
    }
    assert client.post("/api/facturation/factures", json=invoice).status_code == 409
    invoice["lignes"][0]["type_produit"] = "ST"
    assert client.post("/api/facturation/factures", json=invoice).status_code == 201
    invoice["numero"] = "F-LIVRAISON-2"
    assert client.post("/api/facturation/factures", json=invoice).status_code == 409
    response = client.post("/api/hemovigilance/transfusions", json={
        "poche_id": pocket["id"],
        "date_transfusion": dt.datetime.now(dt.timezone.utc).isoformat(),
    })
    assert response.status_code == 201, response.text
    assert len(client.get("/api/hemovigilance/transfusions").json()) == 1
    assert client.post("/api/hemovigilance/transfusions", json={
        "poche_id": pocket["id"],
        "date_transfusion": dt.datetime.now(dt.timezone.utc).isoformat(),
    }).status_code == 409


def test_apheresis_does_not_create_whole_blood(client, donneur_id):
    response = client.post("/api/dons", json={
        "donneur_id": donneur_id, "date_don": dt.date.today().isoformat(),
        "type_don": "PLASMAPHERESE",
    })
    assert response.status_code == 201, response.text
    don_id = response.json()["id"]
    assert not any(p["don_id"] == don_id for p in client.get("/api/poches").json())
    _analyses = []
    for type_test, resultat in [
        ("ABO", "O"), ("RH", "POS"), ("VIH", "NEGATIF"),
        ("VHB", "NEGATIF"), ("VHC", "NEGATIF"), ("SYPHILIS", "NEGATIF"),
    ]:
        _analyses.append(client.post("/api/analyses", json={
            "don_id": don_id, "type_test": type_test, "resultat": resultat,
        }))
    assert client.post(f"/api/liberation/{don_id}/liberer").status_code == 422
    procedure = client.post("/api/apherese", json={
        "don_id": don_id, "donneur_id": donneur_id, "type_apherese": "PLASMAPHERESE",
    })
    assert procedure.status_code == 201, procedure.text
    assert client.patch(f"/api/apherese/{procedure.json()['id']}", json={
        "statut": "TERMINE", "volume_preleve_ml": 350,
    }).status_code == 200
    assert client.post("/api/poches", json={
        "don_id": don_id, "type_produit": "ST", "date_peremption": str(dt.date.today()),
        "emplacement_stock": "COLLECTE",
    }).status_code == 422
    assert client.post("/api/poches", json={
        "don_id": don_id, "type_produit": "PFC",
        "volume_ml": 250,
        "date_peremption": str(dt.date.today() + dt.timedelta(days=30)),
        "emplacement_stock": "COLLECTE",
    }).status_code == 201
    assert client.post(f"/api/liberation/{don_id}/liberer").status_code == 200


def test_billing_rejects_negative_and_excess_payments(client):
    hospital_id = _hospital(client)
    base = {"numero": "F-001", "hopital_id": hospital_id,
            "date_facture": str(dt.date.today()),
            "lignes": [{"type_produit": "ST", "quantite": 1, "prix_unitaire_fcfa": 1000}]}
    assert client.post("/api/facturation/factures", json={
        **base, "lignes": [{"type_produit": "ST", "quantite": -1, "prix_unitaire_fcfa": 1000}],
    }).status_code == 422
    invoice = client.post("/api/facturation/factures", json=base)
    assert invoice.status_code == 201, invoice.text
    invoice_id = invoice.json()["id"]
    payment = {"facture_id": invoice_id, "montant_fcfa": 600,
               "mode_paiement": "ESPECES", "date_paiement": str(dt.date.today())}
    assert client.post("/api/facturation/paiements", json={**payment, "montant_fcfa": -1}).status_code == 422
    assert client.post("/api/facturation/paiements", json=payment).status_code == 201
    assert client.post("/api/facturation/paiements", json=payment).status_code == 409
    assert len(client.get("/api/facturation/paiements", params={"facture_id": invoice_id}).json()) == 1
    stats = client.get("/api/facturation/statistiques").json()
    assert stats["montant_total_fcfa"] == 1000
    assert stats["total_paye_fcfa"] == 600
