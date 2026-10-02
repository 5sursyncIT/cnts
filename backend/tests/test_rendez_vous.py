"""Rendez-vous réels : créneaux, capacité, éligibilité, annulation, suivi par le centre, documents."""

import datetime as dt
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core import creneaux
from app.core.config import settings
from app.core.passwords import hash_password
from app.db.models import DocumentMedical, Don, Donneur, LieuRdv, RendezVous, UserAccount

UTC = dt.timezone.utc
TOUS_LES_JOURS = {str(d): [["08:00", "17:00"]] for d in range(1, 8)}
PDF = b"%PDF-1.4\n%test\n"


@pytest.fixture(autouse=True)
def documents_tmp(tmp_path, monkeypatch):
    monkeypatch.setattr(settings, "documents_dir", str(tmp_path / "documents"))


@pytest.fixture
def mails(monkeypatch) -> list[tuple[str, str]]:
    sent: list[tuple[str, str]] = []
    monkeypatch.setattr("app.api.routes.patient.send_patient_email", lambda to, subject, body: sent.append((to, subject)))
    monkeypatch.setattr("app.api.routes.rendez_vous.send_patient_email", lambda to, subject, body: sent.append((to, subject)))
    return sent


def _lieu(db: Session, capacite: int = 2, **kw) -> LieuRdv:
    lieu = LieuRdv(
        code=kw.pop("code", f"L{uuid.uuid4().hex[:6].upper()}"),
        nom=kw.pop("nom", "Centre test"),
        horaires=kw.pop("horaires", TOUS_LES_JOURS),
        fermetures=kw.pop("fermetures", []),
        duree_creneau_min=30,
        capacite_creneau=capacite,
        delai_min_heures=kw.pop("delai_min_heures", 0),
        horizon_jours=kw.pop("horizon_jours", 90),
        actif=kw.pop("actif", True),
    )
    db.add(lieu)
    db.commit()
    return lieu


def _patient(db: Session, sexe: str = "H", **donneur_kw) -> tuple[Donneur, dict]:
    email = f"p_{uuid.uuid4().hex[:8]}@example.com"
    user = UserAccount(email=email, password_hash=hash_password("password"), email_verified_at=dt.datetime.now(UTC))
    donneur = Donneur(nom="Fall", prenom="Ibou", sexe=sexe, cni_hash=uuid.uuid4().hex, user=user, **donneur_kw)
    db.add_all([user, donneur])
    db.commit()
    return donneur, {"email": email}


def _headers(client: TestClient, who: dict) -> dict:
    token = client.post("/api/auth/login", json={"email": who["email"], "password": "password"}).json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def _demain(heure: int = 10, minute: int = 0, jours: int = 1) -> dt.datetime:
    d = dt.datetime.now(UTC).date() + dt.timedelta(days=jours)
    return dt.datetime.combine(d, dt.time(heure, minute), tzinfo=UTC)


def _reserver(client, headers, lieu, debut, **extra):
    return client.post(
        "/api/me/appointments",
        json={"lieu_id": str(lieu.id), "date_prevue": debut.isoformat(), **extra},
        headers=headers,
    )


# --- Calcul des créneaux (fonctions pures) ----------------------------------------------


def _regle(**kw) -> creneaux.RegleLieu:
    base = dict(horaires={"1": [["08:00", "10:00"]], "6": [["08:00", "09:00"]]}, fermetures=[], duree_creneau_min=30,
                capacite_creneau=2, delai_min_heures=2, horizon_jours=30)
    return creneaux.RegleLieu(**(base | kw))


def test_debuts_du_jour_respecte_horaires_et_fermetures():
    lundi = dt.date(2026, 10, 5)
    heures = [d.strftime("%H:%M") for d in creneaux.debuts_du_jour(_regle(), lundi)]
    assert heures == ["08:00", "08:30", "09:00", "09:30"]
    assert creneaux.debuts_du_jour(_regle(), dt.date(2026, 10, 4)) == []  # dimanche
    assert creneaux.debuts_du_jour(_regle(fermetures=["2026-10-05"]), lundi) == []


def test_creneaux_disponibles_capacite_delai_horizon():
    lundi = dt.date(2026, 10, 5)
    maintenant = dt.datetime(2026, 10, 5, 6, 30, tzinfo=UTC)  # délai 2 h → premier créneau 08:30
    plein = dt.datetime(2026, 10, 5, 9, 0, tzinfo=UTC)
    libres = creneaux.creneaux_disponibles(_regle(), lundi, maintenant, {plein: 2})
    assert [(d.strftime("%H:%M"), n) for d, n in libres] == [("08:30", 2), ("09:30", 2)]
    assert creneaux.creneaux_disponibles(_regle(horizon_jours=0), dt.date(2026, 10, 12), maintenant, {}) == []


def test_erreur_creneau():
    maintenant = dt.datetime(2026, 10, 5, 6, 0, tzinfo=UTC)
    assert creneaux.erreur_creneau(_regle(), dt.datetime(2026, 10, 5, 9, 0, tzinfo=UTC), maintenant) is None
    assert "fermé" in creneaux.erreur_creneau(_regle(), dt.datetime(2026, 10, 5, 9, 15, tzinfo=UTC), maintenant)
    assert "trop proche" in creneaux.erreur_creneau(_regle(), dt.datetime(2026, 10, 5, 7, 30, tzinfo=UTC), maintenant)
    assert "jours à l'avance" in creneaux.erreur_creneau(_regle(horizon_jours=1), dt.datetime(2026, 10, 12, 9, 0, tzinfo=UTC), maintenant)


# --- Côté donneur ------------------------------------------------------------------------


def test_lieux_et_creneaux_du_donneur(client, db_session):
    lieu = _lieu(db_session, capacite=1)
    _lieu(db_session, nom="Fermé", actif=False)
    _, who = _patient(db_session)
    h = _headers(client, who)

    lieux = client.get("/api/me/rdv/lieux", headers=h).json()
    assert [l["nom"] for l in lieux] == ["Centre test"]

    jour = _demain().date().isoformat()
    slots = client.get(f"/api/me/rdv/creneaux?lieu_id={lieu.id}&jour={jour}", headers=h).json()
    assert len(slots) == 18 and slots[0]["places"] == 1  # 08:00 → 16:30

    assert _reserver(client, h, lieu, _demain(8)).status_code == 200
    slots = client.get(f"/api/me/rdv/creneaux?lieu_id={lieu.id}&jour={jour}", headers=h).json()
    assert len(slots) == 17 and not slots[0]["debut"].startswith(f"{jour}T08:00")


def test_reservation_ok_envoie_confirmation(client, db_session, mails):
    lieu = _lieu(db_session)
    _, who = _patient(db_session)
    r = _reserver(client, _headers(client, who), lieu, _demain(), commentaire="Première fois")
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["statut"] == "CONFIRME" and body["lieu"] == "Centre test" and body["lieu_id"] == str(lieu.id)
    assert mails and mails[0][0] == who["email"]


def test_reservation_refusee_hors_creneau_ou_lieu_inactif(client, db_session):
    lieu = _lieu(db_session)
    inactif = _lieu(db_session, actif=False)
    _, who = _patient(db_session)
    h = _headers(client, who)
    assert _reserver(client, h, lieu, _demain(10, 15)).status_code == 422  # pas aligné
    assert _reserver(client, h, lieu, _demain(20)).status_code == 422  # centre fermé
    assert _reserver(client, h, lieu, _demain(jours=-1)).status_code == 422  # passé
    assert _reserver(client, h, lieu, _demain(jours=200)).status_code == 422  # au-delà de l'horizon
    assert _reserver(client, h, inactif, _demain()).status_code == 404


def test_capacite_du_creneau(client, db_session):
    lieu = _lieu(db_session, capacite=1)
    _, a = _patient(db_session)
    _, b = _patient(db_session)
    assert _reserver(client, _headers(client, a), lieu, _demain()).status_code == 200
    r = _reserver(client, _headers(client, b), lieu, _demain())
    assert r.status_code == 409 and "complété" in r.json()["detail"]


def test_un_seul_rdv_a_venir(client, db_session):
    lieu = _lieu(db_session)
    _, who = _patient(db_session)
    h = _headers(client, who)
    assert _reserver(client, h, lieu, _demain()).status_code == 200
    r = _reserver(client, h, lieu, _demain(jours=2))
    assert r.status_code == 409 and "déjà un rendez-vous" in r.json()["detail"]


def test_eligibilite_controlee_a_la_date_du_rdv(client, db_session):
    lieu = _lieu(db_session)
    aujourd_hui = dt.datetime.now(UTC).date()
    donneur, who = _patient(db_session, sexe="F")
    db_session.add(Don(donneur_id=donneur.id, din=f"D{uuid.uuid4().hex[:10]}", date_don=aujourd_hui - dt.timedelta(days=100), type_don="SANG_TOTAL"))
    db_session.commit()
    h = _headers(client, who)

    elig = client.get("/api/me/eligibilite", headers=h).json()
    assert elig["eligible"] is False and elig["eligible_le"]

    r = _reserver(client, h, lieu, _demain())
    assert r.status_code == 422 and "à partir du" in r.json()["detail"]
    eligible_le = dt.date.fromisoformat(elig["eligible_le"])
    jours = (eligible_le - aujourd_hui).days
    assert _reserver(client, h, lieu, _demain(jours=jours)).status_code == 200


def test_trop_age_refuse(client, db_session):
    lieu = _lieu(db_session)
    _, who = _patient(db_session, date_naissance=dt.date(1950, 1, 1))
    r = _reserver(client, _headers(client, who), lieu, _demain())
    assert r.status_code == 422 and "limite" in r.json()["detail"]


def test_annulation_par_le_donneur(client, db_session):
    lieu = _lieu(db_session)
    donneur, who = _patient(db_session)
    _, autre = _patient(db_session)
    h = _headers(client, who)
    rdv = _reserver(client, h, lieu, _demain()).json()

    assert client.put(f"/api/me/appointments/{rdv['id']}", headers=_headers(client, autre)).status_code == 404
    r = client.put(f"/api/me/appointments/{rdv['id']}", headers=h)
    assert r.status_code == 200 and r.json()["statut"] == "ANNULE"
    assert client.put(f"/api/me/appointments/{rdv['id']}", headers=h).status_code == 409  # déjà annulé

    passe = RendezVous(donneur_id=donneur.id, date_prevue=_demain(jours=-2), statut="CONFIRME", lieu_id=lieu.id)
    db_session.add(passe)
    db_session.commit()
    assert client.put(f"/api/me/appointments/{passe.id}", headers=h).status_code == 409


# --- Côté centre ---------------------------------------------------------------------------


def test_liste_et_filtres_du_centre(client, db_session):
    lieu = _lieu(db_session, capacite=5)
    autre_lieu = _lieu(db_session)
    _, a = _patient(db_session)
    donneur_b, b = _patient(db_session, telephone="770000001")
    _reserver(client, _headers(client, a), lieu, _demain())
    _reserver(client, _headers(client, b), autre_lieu, _demain(11))

    tous = client.get("/api/rendez-vous").json()
    assert len(tous) == 2 and tous[0]["donneur"]["nom"] == "Fall"
    assert len(client.get(f"/api/rendez-vous?lieu_id={lieu.id}").json()) == 1
    assert len(client.get("/api/rendez-vous?q=770000001").json()) == 1
    assert len(client.get(f"/api/rendez-vous?donneur_id={donneur_b.id}").json()) == 1
    assert client.get("/api/rendez-vous?statut=ANNULE").json() == []


def test_suivi_par_le_centre(client, db_session, mails):
    lieu = _lieu(db_session)
    donneur, who = _patient(db_session)
    futur = _reserver(client, _headers(client, who), lieu, _demain()).json()

    r = client.patch(f"/api/rendez-vous/{futur['id']}", json={"statut": "EFFECTUE"})
    assert r.status_code == 409  # à venir
    assert client.patch(f"/api/rendez-vous/{futur['id']}", json={"statut": "ANNULE"}).status_code == 422  # sans motif
    r = client.patch(f"/api/rendez-vous/{futur['id']}", json={"statut": "ANNULE", "motif": "Coupure d'électricité"})
    assert r.status_code == 200 and r.json()["motif"] == "Coupure d'électricité"
    assert mails[-1] == (who["email"], "Rendez-vous annulé — CNTS")
    assert client.patch(f"/api/rendez-vous/{futur['id']}", json={"statut": "MANQUE"}).status_code == 409

    passe = RendezVous(donneur_id=donneur.id, date_prevue=_demain(jours=-1), statut="CONFIRME", lieu_id=lieu.id)
    db_session.add(passe)
    db_session.commit()
    r = client.patch(f"/api/rendez-vous/{passe.id}", json={"statut": "MANQUE"})
    assert r.status_code == 200 and r.json()["statut"] == "MANQUE" and r.json()["traite_le"]


def test_gestion_des_lieux(client, db_session):
    payload = {
        "code": "THIES",
        "nom": "CRTS de Thiès",
        "horaires": {"1": [["08:00", "12:00"]]},
        "fermetures": ["2026-12-25"],
        "capacite_creneau": 4,
    }
    r = client.post("/api/rendez-vous/lieux", json=payload)
    assert r.status_code == 201, r.text
    lieu = r.json()
    assert lieu["fermetures"] == ["2026-12-25"]
    assert client.post("/api/rendez-vous/lieux", json=payload).status_code == 409

    bad = payload | {"horaires": {"1": [["12:00", "08:00"]]}}
    assert client.put(f"/api/rendez-vous/lieux/{lieu['id']}", json=bad).status_code == 422
    r = client.put(f"/api/rendez-vous/lieux/{lieu['id']}", json=payload | {"actif": False})
    assert r.status_code == 200 and r.json()["actif"] is False
    assert [l["code"] for l in client.get("/api/rendez-vous/lieux").json()] == ["THIES"]


# --- Documents -----------------------------------------------------------------------------


def _deposer(client, donneur_id, contenu=PDF, mime="application/pdf", type_document="ATTESTATION"):
    return client.post(
        f"/api/donneurs/{donneur_id}/documents",
        data={"titre": "Attestation de don", "type_document": type_document, "date_document": "2026-09-30"},
        files={"fichier": ("attestation.pdf", contenu, mime)},
    )


def test_depot_et_telechargement_de_document(client, db_session):
    donneur, who = _patient(db_session)
    _, autre = _patient(db_session)
    r = _deposer(client, donneur.id)
    assert r.status_code == 201, r.text
    doc = r.json()
    assert doc["mime"] == "application/pdf" and doc["taille"] == len(PDF)

    staff = client.get(f"/api/donneurs/{donneur.id}/documents/{doc['id']}/fichier")
    assert staff.status_code == 200 and staff.content == PDF

    h = _headers(client, who)
    mine = client.get("/api/me/documents", headers=h).json()
    assert mine[0]["fichier_url"] == f"/api/me/documents/{doc['id']}/fichier"
    r = client.get(mine[0]["fichier_url"], headers=h)
    assert r.status_code == 200 and r.content == PDF
    assert client.get(mine[0]["fichier_url"], headers=_headers(client, autre)).status_code == 404

    assert client.delete(f"/api/donneurs/{donneur.id}/documents/{doc['id']}").status_code == 204
    assert client.get("/api/me/documents", headers=h).json() == []


def test_depot_refuse_mauvais_format_ou_type(client, db_session):
    donneur, _ = _patient(db_session)
    assert _deposer(client, donneur.id, contenu=b"MZ\x90\x00", mime="application/pdf").status_code == 415
    assert _deposer(client, donneur.id, mime="text/html").status_code == 415
    assert _deposer(client, donneur.id, type_document="ANALYSE").status_code == 422


def test_les_analyses_ne_sont_jamais_visibles_par_le_donneur(client, db_session):
    donneur, who = _patient(db_session)
    db_session.add(DocumentMedical(donneur_id=donneur.id, titre="Sérologie", type_document="ANALYSE",
                                   fichier_url="https://exemple/x.pdf", date_document=dt.date(2026, 1, 1)))
    db_session.commit()
    assert client.get("/api/me/documents", headers=_headers(client, who)).json() == []
