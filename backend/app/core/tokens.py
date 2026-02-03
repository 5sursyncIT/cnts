import base64
import hashlib
import hmac
import json
import time
from typing import Any


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def _b64url_decode(raw: str) -> bytes:
    padding = "=" * (-len(raw) % 4)
    return base64.urlsafe_b64decode((raw + padding).encode("ascii"))


def sign_token(payload: dict[str, Any], secret: str, ttl_seconds: int) -> str:
    now = int(time.time())
    body = {**payload, "iat": now, "exp": now + ttl_seconds}
    msg = _b64url_encode(json.dumps(body, separators=(",", ":")).encode("utf-8"))
    sig = hmac.new(secret.encode("utf-8"), msg.encode("ascii"), hashlib.sha256).digest()
    return f"CNTS1.{msg}.{_b64url_encode(sig)}"


def verify_token(token: str, secret: str) -> dict[str, Any] | None:
    try:
        prefix, msg, sig = token.split(".", 2)
        if prefix != "CNTS1":
            return None
        expected_sig = hmac.new(secret.encode("utf-8"), msg.encode("ascii"), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64url_encode(expected_sig), sig):
            return None
        payload = json.loads(_b64url_decode(msg).decode("utf-8"))
        if int(payload.get("exp")) < int(time.time()):
            return None
        return payload
    except Exception:
        return None

