"""Rappel des rendez-vous de don, la veille (tâche Celery horaire)."""

import datetime as dt
import logging

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.celery_app import celery_app
from app.core.config import settings
from app.core.patient_mail import rdv_rappel_email, send_patient_email
from app.core.sms import SmsError, normalize_phone, send_sms
from app.db.models import LieuRdv, RendezVous

logger = logging.getLogger(__name__)
UTC = dt.timezone.utc
FENETRE = dt.timedelta(hours=24)

JOURS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"]
MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"]


def _aware(d: dt.datetime) -> dt.datetime:
    return d if d.tzinfo else d.replace(tzinfo=UTC)


def envoyer_rappels(db: Session, maintenant: dt.datetime) -> int:
    """Rappelle les RDV confirmés des prochaines 24 h, pris plus de 24 h à l'avance. Renvoie le nombre traité."""
    rdvs = (
        db.execute(
            select(RendezVous).where(
                RendezVous.statut == "CONFIRME",
                RendezVous.rappel_envoye_le.is_(None),
                RendezVous.date_prevue > maintenant,
                RendezVous.date_prevue <= maintenant + FENETRE,
            )
        )
        .scalars()
        .all()
    )
    traites = 0
    for rdv in rdvs:
        debut = _aware(rdv.date_prevue)
        # Pris moins de 24 h avant : l'email de confirmation suffit.
        if _aware(rdv.created_at) > debut - FENETRE:
            continue
        donneur = rdv.donneur
        lieu = db.get(LieuRdv, rdv.lieu_id) if rdv.lieu_id else None
        quand = f"{JOURS[debut.weekday()]} {debut.day} {MOIS[debut.month - 1]} à {debut.strftime('%Hh%M')}"
        nom_lieu = lieu.nom if lieu else (rdv.lieu or "CNTS")

        compte = donneur.user
        if compte is not None and compte.email_verified_at is not None:
            subject, body = rdv_rappel_email(donneur.prenom, quand, nom_lieu, lieu.adresse if lieu else None)
            send_patient_email(compte.email, subject, body)
        telephone = normalize_phone(donneur.telephone)
        if settings.rdv_rappel_sms and telephone:
            try:
                send_sms(
                    telephone,
                    f"CNTS: rappel de votre don de sang {quand}, {nom_lieu}. "
                    "Apportez votre piece d'identite. Empechement ? Annulez depuis votre espace donneur.",
                    tag="rappel-rdv",
                )
            except SmsError:
                logger.warning("Rappel SMS non envoyé pour le RDV %s", rdv.id)

        rdv.rappel_envoye_le = maintenant
        traites += 1
    db.commit()
    return traites


@celery_app.task(name="app.tasks.rappels.rappels_rendez_vous")
def rappels_rendez_vous() -> dict:
    from app.db.session import SessionLocal

    db = SessionLocal()
    try:
        return {"rappels": envoyer_rappels(db, dt.datetime.now(UTC))}
    finally:
        db.close()
