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

