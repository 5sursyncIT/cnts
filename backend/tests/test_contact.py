"""Formulaire de contact : envoi public, pot de miel, limite par IP, lecture staff."""

from fastapi.testclient import TestClient

from app.api.deps import require_staff
from app.main import app

MSG = {"name": "Awa Ndiaye", "email": "awa@example.sn", "subject": "Collecte", "message": "Bonjour, je souhaite organiser une collecte."}


def test_public_can_send_and_staff_can_read(client: TestClient):
    assert client.post("/api/contact", json=MSG).status_code == 201
    items = client.get("/api/contact").json()
    assert len(items) == 1 and items[0]["status"] == "NOUVEAU"
    r = client.patch(f"/api/contact/{items[0]['id']}", json={"status": "TRAITE"})
    assert r.status_code == 200 and r.json()["status"] == "TRAITE"


def test_honeypot_is_silently_dropped(client: TestClient):
    assert client.post("/api/contact", json={**MSG, "website": "spam"}).status_code == 201
    assert client.get("/api/contact").json() == []


def test_invalid_payload_rejected(client: TestClient):
    assert client.post("/api/contact", json={**MSG, "email": "pas-un-email"}).status_code == 422


def test_rate_limited_per_ip(client: TestClient):
    headers = {"X-Forwarded-For": "203.0.113.9"}
    codes = [client.post("/api/contact", json=MSG, headers=headers).status_code for _ in range(6)]
    assert codes[:5] == [201] * 5 and codes[5] == 429


def test_listing_requires_staff(client: TestClient):
    saved = app.dependency_overrides.pop(require_staff)
    try:
        assert client.get("/api/contact").status_code == 401
        assert client.post("/api/contact", json=MSG).status_code == 201
    finally:
        app.dependency_overrides[require_staff] = saved
