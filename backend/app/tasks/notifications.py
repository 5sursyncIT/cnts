"""Notification sending tasks."""

import logging

from app.core.celery_app import celery_app

logger = logging.getLogger(__name__)


@celery_app.task(name="app.tasks.notifications.send_notification", bind=True, max_retries=3)
def send_notification(self, notification_id: str) -> dict:
    """Send a notification via the appropriate channel (email, SMS, WhatsApp)."""
    import datetime as dt
    import uuid

    from app.db.models import Notification
    from app.db.session import SessionLocal

    db = SessionLocal()
    try:
        notif = db.get(Notification, uuid.UUID(notification_id))
        if notif is None:
            logger.error("Notification %s introuvable", notification_id)
            return {"status": "erreur", "detail": "notification introuvable"}

        if notif.statut == "ENVOYE":
            return {"status": "deja_envoye"}

        notif.tentatives += 1

        try:
            if notif.canal == "EMAIL":
                _send_email(notif.destinataire, notif.template, notif.variables)
            elif notif.canal == "SMS":
                _send_sms(notif.destinataire, notif.template, notif.variables)
            elif notif.canal == "WHATSAPP":
                _send_whatsapp(notif.destinataire, notif.template, notif.variables)

            notif.statut = "ENVOYE"
            notif.sent_at = dt.datetime.now(dt.timezone.utc)
            db.commit()
            return {"status": "envoye"}
        except Exception as exc:
            notif.statut = "ECHEC"
            notif.erreur = str(exc)[:500]
            db.commit()
            raise self.retry(exc=exc, countdown=60 * (2**self.request.retries))
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def _send_email(destinataire: str, template: str, variables: dict) -> None:
    """Send a plain-text notification through the IP-authorized SMTP relay."""
    import json
    import smtplib
    from email.message import EmailMessage

    from app.core.config import settings

    if settings.env == "dev" and settings.smtp_host == "localhost":
        logger.info(
            "[DEV] Email simulé vers %s | template=%s | variables=%s",
            destinataire,
            template,
            variables,
        )
        return

    message = EmailMessage()
    message["From"] = settings.smtp_sender
    message["To"] = destinataire
    message["Subject"] = template
    body = variables.get("body")
    message.set_content(
        body if isinstance(body, str) else json.dumps(variables, ensure_ascii=False, indent=2)
    )

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=10) as smtp:
        smtp.send_message(message)


def _send_sms(destinataire: str, template: str, variables: dict) -> None:
    """Send SMS via provider API. To be configured with real SMS provider."""
    from app.core.config import settings

    if settings.env == "dev":
        logger.info(
            "[DEV] SMS simulé vers %s | template=%s | variables=%s",
            destinataire,
            template,
            variables,
        )
        return

    logger.warning("Envoi SMS non configuré en production pour %s", destinataire)


def _send_whatsapp(destinataire: str, template: str, variables: dict) -> None:
    """Send WhatsApp message via Business API. To be configured."""
    from app.core.config import settings

    if settings.env == "dev":
        logger.info(
            "[DEV] WhatsApp simulé vers %s | template=%s | variables=%s",
            destinataire,
            template,
            variables,
        )
        return

    logger.warning("Envoi WhatsApp non configuré en production pour %s", destinataire)
