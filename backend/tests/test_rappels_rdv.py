"""Rappel des rendez-vous la veille et enregistrement des tâches Celery."""

import datetime as dt
import uuid

from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import Donneur, LieuRdv, RendezVous, UserAccount
from app.tasks import rappels

UTC = dt.timezone.utc
NOW = dt.datetime(2026, 10, 5, 12, 0, tzinfo=UTC)


def _rdv(db: Session, dans_heures: float, pris_il_y_a_heures: float = 72, statut="CONFIRME", verifie=True, telephone=None):
    user = UserAccount(email=f"r_{uuid.uuid4().hex[:8]}@example.com", password_hash="x",
                       email_verified_at=NOW if verifie else None)
    donneur = Donneur(nom="Ba", prenom="Aïda", sexe="F", cni_hash=uuid.uuid4().hex, user=user, telephone=telephone)
    lieu = LieuRdv(code=uuid.uuid4().hex[:8].upper(), nom="Siège", adresse="Fann", horaires={}, fermetures=[])
    db.add_all([user, donneur, lieu])
    db.flush()
    rdv = RendezVous(donneur_id=donneur.id, lieu_id=lieu.id, lieu=lieu.nom, statut=statut,
                     date_prevue=NOW + dt.timedelta(hours=dans_heures),
                     created_at=NOW - dt.timedelta(hours=pris_il_y_a_heures))
    db.add(rdv)
    db.commit()
    return rdv, user


def test_rappel_envoye_une_seule_fois(db_session, monkeypatch):
    envoyes = []
    monkeypatch.setattr(rappels, "send_patient_email", lambda to, subject, body: envoyes.append((to, body)))
    rdv, user = _rdv(db_session, dans_heures=20)

    assert rappels.envoyer_rappels(db_session, NOW) == 1
    assert envoyes[0][0] == user.email and "mardi 6 octobre à 08h00" in envoyes[0][1]
    assert rappels.envoyer_rappels(db_session, NOW + dt.timedelta(hours=1)) == 0
    db_session.refresh(rdv)
    assert rdv.rappel_envoye_le is not None


def test_pas_de_rappel_hors_fenetre_ou_non_confirme(db_session, monkeypatch):
    envoyes = []
    monkeypatch.setattr(rappels, "send_patient_email", lambda *a: envoyes.append(a))
    _rdv(db_session, dans_heures=30)  # après-demain
    _rdv(db_session, dans_heures=20, statut="ANNULE")
    _rdv(db_session, dans_heures=20, pris_il_y_a_heures=3)  # pris la veille : la confirmation suffit
    assert rappels.envoyer_rappels(db_session, NOW) == 0
    assert envoyes == []


def test_sms_seulement_si_active(db_session, monkeypatch):
    sms = []
    monkeypatch.setattr(rappels, "send_patient_email", lambda *a: None)
    monkeypatch.setattr(rappels, "send_sms", lambda to, content, tag: sms.append(to))
    _rdv(db_session, dans_heures=20, verifie=False, telephone="771234567")
    rappels.envoyer_rappels(db_session, NOW)
    assert sms == []

    monkeypatch.setattr(settings, "rdv_rappel_sms", True)
    _rdv(db_session, dans_heures=21, verifie=False, telephone="771234568")
    rappels.envoyer_rappels(db_session, NOW)
    assert sms == ["221771234568"]


def test_toutes_les_taches_planifiees_sont_enregistrees():
    from app.core.celery_app import celery_app

    celery_app.loader.import_default_modules()
    for entry in celery_app.conf.beat_schedule.values():
        assert entry["task"] in celery_app.tasks
