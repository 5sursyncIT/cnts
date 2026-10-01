"""Transferts ouverts au module stock ; gestion des sites réservée à l'admin."""

import uuid

from fastapi.testclient import TestClient

from app.api.deps import get_current_user, require_admin, require_staff
from app.db.models import UserAccount
from app.main import app


def _agent_stock() -> UserAccount:
    return UserAccount(id=uuid.uuid4(), email="stock@cnts.local", password_hash="x", is_active=True, role="agent_stock")


def test_agent_stock_peut_lister_transferts_mais_pas_creer_site(client: TestClient):
    saved_staff = app.dependency_overrides[require_staff]
    saved_admin = app.dependency_overrides.pop(require_admin)
    app.dependency_overrides[require_staff] = _agent_stock
    app.dependency_overrides[get_current_user] = _agent_stock
    try:
        assert client.get("/api/sites/transferts").status_code == 200
        assert client.get("/api/sites").status_code == 200
        r = client.post("/api/sites", json={"code": "S1", "nom": "Site test", "type_site": "CENTRE"})
        assert r.status_code == 403
    finally:
        app.dependency_overrides.pop(get_current_user, None)
        app.dependency_overrides[require_staff] = saved_staff
        app.dependency_overrides[require_admin] = saved_admin
