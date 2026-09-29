"""Contrôle d'accès de l'API : les routes métier exigent un compte du personnel,
la gestion des comptes exige un administrateur, les routes publiques restent
ouvertes. Ces tests retirent les surcharges RBAC posées par conftest."""

import uuid

import pytest
from fastapi.testclient import TestClient

from app.api.deps import require_admin, require_staff
from app.core.config import settings
from app.core.passwords import hash_password
from app.core.tokens import sign_token
from app.db.models import UserAccount
from app.main import app


@pytest.fixture
def real_rbac():
    saved = {dep: app.dependency_overrides.pop(dep, None) for dep in (require_staff, require_admin)}
    yield
    for dep, override in saved.items():
        if override is not None:
            app.dependency_overrides[dep] = override


def _token(db_session, role: str) -> str:
    user = UserAccount(
        id=uuid.uuid4(),
        email=f"{role.lower()}-{uuid.uuid4().hex[:6]}@cnts.local",
        password_hash=hash_password("x"),
        is_active=True,
        role=role,
    )
    db_session.add(user)
    db_session.commit()
    return sign_token(
        {"sub": str(user.id), "type": "access"}, secret=settings.auth_token_secret, ttl_seconds=600
    )


@pytest.mark.parametrize(
    "method,path",
    [
        ("GET", "/api/users"),
        ("POST", "/api/users"),
        ("GET", "/api/receveurs"),
        ("GET", "/api/dons"),
        ("GET", "/api/sync/events"),
        ("GET", "/api/collectes"),
        ("POST", "/api/collectes"),
    ],
)
def test_anonymous_is_rejected(client: TestClient, real_rbac, method, path):
    assert client.request(method, path, json={}).status_code == 401


@pytest.mark.parametrize("path", ["/api/health", "/api/articles", "/api/faq", "/api/collectes/calendrier"])
def test_public_routes_stay_open(client: TestClient, real_rbac, path):
    assert client.get(path).status_code == 200


def test_staff_bearer_and_cookie_accepted(client: TestClient, db_session, real_rbac):
    token = _token(db_session, "MEDECIN")
    assert client.get("/api/receveurs", headers={"Authorization": f"Bearer {token}"}).status_code == 200
    with TestClient(app, cookies={"cnts_access": token}) as c:
        assert c.get("/api/receveurs").status_code == 200


def test_patient_cannot_reach_staff_routes(client: TestClient, db_session, real_rbac):
    token = _token(db_session, "PATIENT")
    assert client.get("/api/receveurs", headers={"Authorization": f"Bearer {token}"}).status_code == 403


def test_users_management_requires_admin(client: TestClient, db_session, real_rbac):
    staff = _token(db_session, "MEDECIN")
    admin = _token(db_session, "ADMIN")
    assert client.get("/api/users", headers={"Authorization": f"Bearer {staff}"}).status_code == 403
    assert client.get("/api/users", headers={"Authorization": f"Bearer {admin}"}).status_code == 200


def test_module_permissions_are_enforced_by_api(client: TestClient, db_session, real_rbac):
    stock_token = _token(db_session, "agent_stock")
    headers = {"Authorization": f"Bearer {stock_token}"}
    assert client.get("/api/poches", headers=headers).status_code == 200
    assert client.get("/api/donneurs", headers=headers).status_code == 403
    assert client.get("/api/receveurs", headers=headers).status_code == 403
    assert client.get("/api/trace/events", headers=headers).status_code == 403
