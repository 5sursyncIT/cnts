"""Limitation de débit : IP client fiable derrière proxy et réponse 429 propre."""

from fastapi import FastAPI
from fastapi.testclient import TestClient
from starlette.requests import Request

from app.core import rate_limit
from app.core.rate_limit import RateLimitMiddleware, get_client_ip


def _request(peer: str, xff: str | None = None) -> Request:
    headers = [(b"x-forwarded-for", xff.encode())] if xff else []
    return Request({"type": "http", "headers": headers, "client": (peer, 1234)})


def test_xff_from_trusted_proxy_uses_last_hop():
    # Apache ajoute l'IP réelle en DERNIER ; la gauche est fournie par le client.
    assert get_client_ip(_request("172.18.0.1", "1.2.3.4, 198.51.100.7")) == "198.51.100.7"
    assert get_client_ip(_request("127.0.0.1", "198.51.100.7")) == "198.51.100.7"


def test_xff_from_untrusted_peer_is_ignored():
    assert get_client_ip(_request("41.82.10.5", "1.2.3.4")) == "41.82.10.5"


def test_no_xff_falls_back_to_peer():
    assert get_client_ip(_request("172.18.0.4")) == "172.18.0.4"


def test_limit_returns_429_not_500(monkeypatch):
    monkeypatch.setattr(rate_limit.settings, "env", "production")
    monkeypatch.setattr(rate_limit, "_counter", rate_limit.RequestCounter())
    app = FastAPI()
    app.add_middleware(RateLimitMiddleware)

    @app.post("/api/auth/login")
    def login() -> dict:
        return {"ok": True}

    client = TestClient(app)
    codes = [client.post("/api/auth/login").status_code for _ in range(11)]
    assert codes[:10] == [200] * 10
    assert codes[10] == 429
