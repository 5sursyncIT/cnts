"""Envoi de SMS transactionnels.

Fournisseur provisoire : Brevo (API « transactionalSMS »), en attendant un opérateur
local. Pour changer de fournisseur, seul ``send_sms`` est à réécrire.
"""

import json
import logging
import re
import urllib.error
import urllib.request

from app.core.config import settings

logger = logging.getLogger(__name__)

BREVO_SMS_URL = "https://api.brevo.com/v3/transactionalSMS/send"


class SmsError(Exception):
    """Le SMS n'a pas pu être remis au fournisseur."""


def normalize_phone(raw: str | None) -> str | None:
    """Numéro international sans « + » (format attendu par Brevo), ou None s'il est inexploitable.

    Les numéros sénégalais saisis sans indicatif (9 chiffres, 7x ou 3x) reçoivent le 221.
    """
    if not raw:
        return None
    digits = re.sub(r"\D", "", raw)
    if digits.startswith("00"):
        digits = digits[2:]
    if len(digits) == 9 and digits[0] in "73":
        digits = "221" + digits
    return digits if 10 <= len(digits) <= 15 else None


def mask_phone(phone: str) -> str:
    """« +221 •• ••• •• 67 » : assez pour reconnaître son numéro, pas pour l'apprendre."""
    return f"+{phone[:3]} •• ••• •• {phone[-2:]}"


def send_sms(recipient: str, content: str, tag: str) -> None:
    if not settings.sms_api_key:
        if settings.env == "dev":
            logger.info("[DEV] SMS simulé vers %s : %s", recipient, content)
            return
        raise SmsError("Envoi de SMS non configuré (CNTS_SMS_API_KEY)")

    body = json.dumps(
        {
            "sender": settings.sms_sender,
            "recipient": recipient,
            "content": content,
            "type": "transactional",
            "tag": tag,
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        settings.sms_api_url or BREVO_SMS_URL,
        data=body,
        method="POST",
        headers={"accept": "application/json", "content-type": "application/json", "api-key": settings.sms_api_key},
    )
    try:
        with urllib.request.urlopen(request, timeout=10) as response:
            response.read()
    except urllib.error.HTTPError as exc:
        detail = exc.read()[:300].decode("utf-8", "replace")
        logger.error("Brevo SMS refusé (%s) : %s", exc.code, detail)
        raise SmsError(f"Brevo HTTP {exc.code}") from exc
    except (urllib.error.URLError, TimeoutError) as exc:
        logger.error("Brevo SMS injoignable : %s", exc)
        raise SmsError("Brevo injoignable") from exc
