"""Emails transactionnels de l'espace patient (confirmation d'adresse, mot de passe oublié).

Envoyés directement par le relais SMTP, en tâche de fond de la requête : les liens
contiennent un jeton d'accès au compte et ne doivent donc pas être stockés en base
(contrairement aux notifications Celery, conservées dans la table ``notifications``).
"""

import logging

from app.core.config import settings
from app.tasks.notifications import _send_email

logger = logging.getLogger(__name__)

SIGNATURE = "\n\n—\nCentre National de Transfusion Sanguine (CNTS)\nCet email est envoyé automatiquement, merci de ne pas y répondre."


def portal_link(path: str, token: str) -> str:
    return f"{settings.portal_url.rstrip('/')}{path}?token={token}"


def send_patient_email(to: str, subject: str, body: str) -> None:
    try:
        _send_email(to, subject, {"body": body + SIGNATURE})
    except Exception:
        # Pas de nouvel essai : la personne peut redemander l'email depuis le portail.
        logger.exception("Échec d'envoi de l'email patient « %s »", subject)


def verification_email(prenom: str, link: str) -> tuple[str, str]:
    return (
        "Confirmez votre adresse email — Espace donneur CNTS",
        f"Bonjour {prenom},\n\n"
        "Votre compte de l'espace donneur du CNTS a été créé. Pour l'activer, confirmez votre "
        f"adresse email en ouvrant ce lien (valable 48 heures) :\n\n{link}\n\n"
        "Si vous n'êtes pas à l'origine de cette demande, ignorez ce message et prévenez le CNTS : "
        "quelqu'un a peut-être utilisé vos informations.",
    )


def password_reset_email(prenom: str, link: str) -> tuple[str, str]:
    return (
        "Réinitialisation de votre mot de passe — Espace donneur CNTS",
        f"Bonjour {prenom},\n\n"
        "Une demande de réinitialisation du mot de passe de votre espace donneur a été faite. "
        f"Pour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure, utilisable une seule fois) :\n\n{link}\n\n"
        "Si vous n'avez rien demandé, ignorez ce message : votre mot de passe actuel reste valable.",
    )


def rdv_confirmation_email(prenom: str, quand: str, lieu: str, adresse: str | None) -> tuple[str, str]:
    ou = f"{lieu} ({adresse})" if adresse else lieu
    return (
        "Votre rendez-vous de don de sang — CNTS",
        f"Bonjour {prenom},\n\n"
        f"Votre rendez-vous de don de sang est confirmé pour le {quand}, à : {ou}.\n\n"
        "Le jour du don : venez reposé(e), après avoir mangé et bu, avec votre pièce d'identité. "
        "Présentez-vous 10 minutes avant l'heure prévue.\n\n"
        "Un empêchement ? Annulez le rendez-vous depuis votre espace donneur pour libérer la place.",
    )


def rdv_annulation_email(prenom: str, quand: str, lieu: str, motif: str | None) -> tuple[str, str]:
    return (
        "Rendez-vous annulé — CNTS",
        f"Bonjour {prenom},\n\n"
        f"Votre rendez-vous de don de sang du {quand} ({lieu}) a été annulé par le centre"
        + (f" : {motif}" if motif else ".")
        + "\n\nVous pouvez reprendre un rendez-vous depuis votre espace donneur. Merci de votre compréhension.",
    )


def rdv_rappel_email(prenom: str, quand: str, lieu: str, adresse: str | None) -> tuple[str, str]:
    ou = f"{lieu} ({adresse})" if adresse else lieu
    return (
        "Rappel : votre don de sang demain — CNTS",
        f"Bonjour {prenom},\n\n"
        f"Nous vous attendons le {quand}, à : {ou}.\n\n"
        "Pensez à bien manger et à boire avant de venir, et apportez votre pièce d'identité.\n\n"
        "Un empêchement ? Annulez le rendez-vous depuis votre espace donneur pour libérer la place. "
        "Merci pour votre générosité !",
    )
