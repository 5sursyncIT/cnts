import datetime as dt
import os
import time
import uuid

import httpx
import pytest


BASE_URL = "http://localhost:8000"


def _wait_api_ready(client: httpx.Client, timeout_s: float = 15.0) -> None:
    if os.environ.get("CNTS_RUN_E2E") != "1":
        pytest.skip("E2E désactivés (définir CNTS_RUN_E2E=1 pour activer)")
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        try:
            r = client.get("/health", timeout=2)
            if r.status_code == 200:
                return
        except Exception:
            pass
        time.sleep(0.25)
    raise RuntimeError("API not ready")


def _post(client: httpx.Client, path: str, payload: dict) -> dict:
    r = client.post(path, json=payload)
    r.raise_for_status()
    return r.json()


def _create_hopital(client: httpx.Client) -> dict:
    nom = f"Hopital Test {uuid.uuid4().hex[:8]}"
    return _post(
        client,
        "/hopitaux",
        {"nom": nom, "adresse": "Dakar", "contact": "test", "convention_actif": True},
    )


def _create_donneur(client: httpx.Client) -> dict:
    return _post(
        client,
        "/donneurs",
        {
            "cni": f"CNI-{uuid.uuid4().hex[:12]}",
            "nom": "Diop",
            "prenom": "Amadou",
            "sexe": "H",
        },
    )


def _create_libere_st(client: httpx.Client, *, date_don: dt.date) -> dict:
    donneur = _create_donneur(client)
    don = _post(
        client,
        "/dons",
        {
            "donneur_id": donneur["id"],
            "date_don": date_don.isoformat(),
            "type_don": "SANG_TOTAL",
        },
    )
    don_id = don["id"]

    analyses = [
        ("ABO", "O"),
        ("RH", "POS"),
        ("VIH", "NEGATIF"),
        ("VHB", "NEGATIF"),
        ("VHC", "NEGATIF"),
        ("SYPHILIS", "NEGATIF"),
    ]
    for t, res in analyses:
        _post(client, "/analyses", {"don_id": don_id, "type_test": t, "resultat": res})

    r = client.post(f"/liberation/{don_id}/liberer")
    r.raise_for_status()

    stock = client.get("/stock/poches", params={"type_produit": "ST", "statut_stock": "EN_STOCK"})
    stock.raise_for_status()
    source = next(p for p in stock.json() if p["don_id"] == don_id)
    return {"don_id": don_id, "din": don["din"], "poche_st_id": source["id"]}


def _fractionner_cgr(client: httpx.Client, poche_st_id: str) -> dict:
    r = client.post(
        "/stock/fractionnements",
        json={
            "source_poche_id": poche_st_id,
            "composants": [{"type_produit": "CGR", "volume_ml": 280}],
            "idempotency_key": f"e2e-frac-{uuid.uuid4().hex[:8]}",
        },
    )
    r.raise_for_status()
    payload = r.json()
    cgr_id = payload["poches_creees"][0]["id"]
    poche = client.get(f"/poches/{cgr_id}")
    poche.raise_for_status()
    return poche.json()


def _create_receveur(client: httpx.Client, groupe: str) -> dict:
    return _post(client, "/receveurs", {"nom": "Patient", "groupe_sanguin": groupe})


def test_distribution_workflow_fefo_crossmatch_cancel() -> None:
    with httpx.Client(base_url=BASE_URL) as client:
        _wait_api_ready(client)

        hopital = _create_hopital(client)

        today = dt.date.today()
        older = _create_libere_st(client, date_don=today - dt.timedelta(days=2))
        newer = _create_libere_st(client, date_don=today)

        poche_old = _fractionner_cgr(client, older["poche_st_id"])
        poche_new = _fractionner_cgr(client, newer["poche_st_id"])

        assert poche_old["statut_distribution"] == "DISPONIBLE"
        assert poche_new["statut_distribution"] == "DISPONIBLE"
        assert dt.date.fromisoformat(poche_old["date_peremption"]) <= dt.date.fromisoformat(
            poche_new["date_peremption"]
        )

        receveur = _create_receveur(client, "O+")

        cmd = _post(
            client,
            "/commandes",
            {
                "hopital_id": hopital["id"],
                "date_livraison_prevue": today.isoformat(),
                "lignes": [{"type_produit": "CGR", "groupe_sanguin": "O+", "quantite": 1}],
            },
        )
        cmd_id = cmd["id"]
        line_id = cmd["lignes"][0]["id"]

        val = _post(client, f"/commandes/{cmd_id}/valider", {"duree_reservation_heures": 24})
        reserved_poche_id = val["reservations"][0]["poche_id"]
        assert reserved_poche_id == poche_old["id"]

        _post(
            client,
            f"/commandes/{cmd_id}/affecter",
            {"affectations": [{"ligne_commande_id": line_id, "receveur_id": receveur["id"], "quantite": 1}]},
        )

        r = client.post(f"/commandes/{cmd_id}/servir", json={})
        assert r.status_code == 409

        _post(
            client,
            "/cross-match",
            {"poche_id": reserved_poche_id, "receveur_id": receveur["id"], "resultat": "COMPATIBLE"},
        )

        served = _post(client, f"/commandes/{cmd_id}/servir", {})
        assert served["statut"] == "SERVIE"

        poche = client.get(f"/poches/{reserved_poche_id}")
        poche.raise_for_status()
        assert poche.json()["statut_distribution"] == "DISTRIBUE"

        cmd2 = _post(
            client,
            "/commandes",
            {
                "hopital_id": hopital["id"],
                "date_livraison_prevue": today.isoformat(),
                "lignes": [{"type_produit": "CGR", "groupe_sanguin": "O+", "quantite": 1}],
            },
        )
        cmd2_id = cmd2["id"]
        val2 = _post(client, f"/commandes/{cmd2_id}/valider", {"duree_reservation_heures": 24})
        reserved2_id = val2["reservations"][0]["poche_id"]

        r = client.post(f"/commandes/{cmd2_id}/annuler")
        r.raise_for_status()

        poche2 = client.get(f"/poches/{reserved2_id}")
        poche2.raise_for_status()
        assert poche2.json()["statut_distribution"] == "DISPONIBLE"
