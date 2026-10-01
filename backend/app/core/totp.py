import base64
import hashlib
import hmac
import struct
import time


def _normalize_secret(secret: str) -> str:
    return secret.strip().replace(" ", "").upper()


def _hotp(secret_b32: str, counter: int, digits: int = 6) -> str:
    key = base64.b32decode(_normalize_secret(secret_b32), casefold=True)
    msg = struct.pack(">Q", counter)
    digest = hmac.new(key, msg, hashlib.sha1).digest()
    offset = digest[-1] & 0x0F
    code_int = struct.unpack(">I", digest[offset : offset + 4])[0] & 0x7FFFFFFF
    return str(code_int % (10**digits)).zfill(digits)


def generate_totp(secret_b32: str, time_step: int = 30, digits: int = 6, t0: int = 0) -> str:
    counter = int((int(time.time()) - t0) / time_step)
    return _hotp(secret_b32, counter=counter, digits=digits)


def verify_totp(
    secret_b32: str,
    token: str,
    window: int = 1,
    time_step: int = 30,
    digits: int = 6,
    t0: int = 0,
) -> bool:
    token_norm = token.strip().replace(" ", "")
    if len(token_norm) != digits or not token_norm.isdigit():
        return False

    now_counter = int((int(time.time()) - t0) / time_step)
    for delta in range(-window, window + 1):
        if hmac.compare_digest(_hotp(secret_b32, now_counter + delta, digits=digits), token_norm):
            return True
    return False


def generate_secret(num_bytes: int = 20) -> str:
    """Secret TOTP aléatoire encodé en base32 (160 bits, format attendu par les applis)."""
    import secrets

    return base64.b32encode(secrets.token_bytes(num_bytes)).decode("ascii").rstrip("=")


def provisioning_uri(secret_b32: str, account: str, issuer: str = "SGI-CNTS") -> str:
    """URI otpauth:// à encoder dans le QR code d'enrôlement."""
    from urllib.parse import quote, urlencode

    label = quote(f"{issuer}:{account}")
    query = urlencode({"secret": secret_b32, "issuer": issuer, "algorithm": "SHA1", "digits": 6, "period": 30})
    return f"otpauth://totp/{label}?{query}"


def match_totp_step(
    secret_b32: str,
    token: str,
    window: int = 1,
    time_step: int = 30,
    digits: int = 6,
) -> int | None:
    """Comme verify_totp, mais renvoie le pas temporel reconnu (pour refuser les rejeux)."""
    token_norm = token.strip().replace(" ", "")
    if len(token_norm) != digits or not token_norm.isdigit():
        return None

    now_counter = int(time.time()) // time_step
    for delta in range(-window, window + 1):
        step = now_counter + delta
        if hmac.compare_digest(_hotp(secret_b32, step, digits=digits), token_norm):
            return step
    return None
