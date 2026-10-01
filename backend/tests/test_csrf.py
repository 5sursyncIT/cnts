"""CSRF : écritures par cookie refusées depuis une origine étrangère."""

from fastapi.testclient import TestClient

MSG = {"name": "Awa", "email": "awa@example.sn", "subject": "Test", "message": "Bonjour, ceci est un test."}


def test_cookie_write_from_foreign_origin_is_refused(client: TestClient):
    client.cookies.set("cnts_access", "jeton")
    try:
        r = client.post("/api/contact", json=MSG, headers={"Origin": "https://evil.example"})
        assert r.status_code == 403
        r = client.post("/api/contact", json=MSG, headers={"Origin": "https://cnts.gouv.sn"})
        assert r.status_code == 201
    finally:
        client.cookies.clear()


def test_bearer_and_cookieless_requests_unaffected(client: TestClient):
    r = client.post("/api/contact", json=MSG, headers={"Origin": "https://evil.example"})
    assert r.status_code == 201
