"""Periodic maintenance tasks."""

import datetime as dt
import logging

from app.core.celery_app import celery_app
from app.db.session import SessionLocal

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.maintenance.sweep_reservations")
def sweep_reservations() -> dict:
    """Release expired reservations and restore bag availability."""
    from sqlalchemy import select, update

    from app.audit.events import log_event
    from app.db.models import Poche, Reservation

    db = SessionLocal()
    try:
        now = dt.datetime.now(dt.timezone.utc)
        stmt = (
            select(Reservation)
            .where(Reservation.expires_at < now)
            .where(Reservation.released_at.is_(None))
        )
        expired = list(db.execute(stmt).scalars())

        released_count = 0
        for reservation in expired:
            reservation.released_at = now
            db.execute(
                update(Poche)
                .where(Poche.id == reservation.poche_id)
                .values(statut_distribution="DISPONIBLE")
            )
            log_event(
                db,
                aggregate_type="reservation",
                aggregate_id=reservation.id,
                event_type="reservation.expiree",
                payload={
                    "poche_id": str(reservation.poche_id),
                    "commande_id": str(reservation.commande_id),
                },
            )
            released_count += 1

        db.commit()
        logger.info("Sweep terminé : %d réservations expirées libérées", released_count)
        return {"released_count": released_count}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@celery_app.task(name="app.tasks.maintenance.check_expiration_alerts")
def check_expiration_alerts() -> dict:
    """Check for bags nearing expiration and log alerts."""
    import datetime as dt

    from sqlalchemy import func, select

    from app.audit.events import log_event
    from app.db.models import Poche

    db = SessionLocal()
    try:
        today = dt.date.today()
        alert_date = today + dt.timedelta(days=7)

        stmt = (
            select(Poche)
            .where(Poche.statut_distribution == "DISPONIBLE")
            .where(Poche.date_peremption <= alert_date)
            .where(Poche.date_peremption >= today)
        )
        expiring = list(db.execute(stmt).scalars())

        for poche in expiring:
            log_event(
                db,
                aggregate_type="poche",
                aggregate_id=poche.id,
                event_type="poche.alerte_peremption",
                payload={
                    "type_produit": poche.type_produit,
                    "date_peremption": str(poche.date_peremption),
                    "jours_restants": (poche.date_peremption - today).days,
                },
            )

        db.commit()
        logger.info("Alertes péremption : %d poches proches de l'expiration", len(expiring))
        return {"expiring_count": len(expiring)}
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
