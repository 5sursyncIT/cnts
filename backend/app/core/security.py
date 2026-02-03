import hashlib
import hmac

from app.core.config import settings


def hash_cni(cni: str) -> str:
    normalized = "".join(c for c in cni.strip() if c.isalnum()).upper()
    digest = hmac.new(
        key=settings.cni_hash_key.encode("utf-8"),
        msg=normalized.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()
    return digest
