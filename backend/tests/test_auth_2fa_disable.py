import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.audit.events import TraceEvent
from app.core.passwords import hash_password, hash_recovery_code
from app.core.totp import generate_totp
from app.db.base import Base
from app.db.models import UserAccount, UserRecoveryCode
from app.db.session import get_db
from app.main import app

SQLALCHEMY_TEST_DATABASE_URL = "sqlite://"
engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_database():
    previous = app.dependency_overrides.get(get_db)
    app.dependency_overrides[get_db] = override_get_db
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    if previous is None:
        del app.dependency_overrides[get_db]
    else:
        app.dependency_overrides[get_db] = previous


def create_user_with_2fa(*, email: str, password: str, secret: str, recovery_codes: list[str]):
    db = TestingSessionLocal()
    try:
        user = UserAccount(
            id=uuid.uuid4(),
            email=email,
            password_hash=hash_password(password),
            is_active=True,
            mfa_enabled=True,
            mfa_secret=secret,
        )
        db.add(user)
        for code in recovery_codes:
            db.add(
                UserRecoveryCode(
                    id=uuid.uuid4(),
                    user_id=user.id,
                    code_hash=hash_recovery_code(code, secret="dev-only-change-me"),
                )
            )
        db.commit()
        return user.id
    finally:
        db.close()


def test_disable_2fa_is_effective_and_irreversible():
    user_id = create_user_with_2fa(
        email="agent@cnts.local",
        password="pw",
        secret="JBSWY3DPEHPK3PXP",
        recovery_codes=["r1", "r2"],
    )

    login_res = client.post("/auth/login", json={"email": "agent@cnts.local", "password": "pw"})
    assert login_res.status_code == 200
    assert login_res.json()["mfa_required"] is True
    challenge = login_res.json()["challenge_token"]

    token = generate_totp("JBSWY3DPEHPK3PXP")
    ok_res = client.post("/auth/mfa/verify", json={"challenge_token": challenge, "token": token})
    assert ok_res.status_code == 200
    assert "access_token" in ok_res.json()

    disable_res = client.post(
        f"/admin/auth/2fa/disable/{user_id}",
        json={"reason": "incident"},
        headers={"X-Admin-Token": "dev-admin-token", "X-Admin-Email": "admin@cnts.local"},
    )
    assert disable_res.status_code == 200
    assert disable_res.json()["user_id"] == str(user_id)
    assert disable_res.json()["recovery_codes_revoked"] == 2

    login_res2 = client.post("/auth/login", json={"email": "agent@cnts.local", "password": "pw"})
    assert login_res2.status_code == 200
    assert login_res2.json()["mfa_required"] is False
    assert "access_token" in login_res2.json()

    blocked_res = client.post("/auth/mfa/verify", json={"challenge_token": challenge, "token": token})
    assert blocked_res.status_code == 400
    assert blocked_res.json()["detail"] == "2fa_not_enabled"

    db = TestingSessionLocal()
    try:
        stmt = select(UserRecoveryCode).where(UserRecoveryCode.user_id == user_id)
        assert list(db.execute(stmt).scalars()) == []
        audit_stmt = (
            select(TraceEvent)
            .where(TraceEvent.aggregate_type == "user")
            .where(TraceEvent.aggregate_id == user_id)
            .where(TraceEvent.event_type == "auth.2fa_disabled")
        )
        events = list(db.execute(audit_stmt).scalars())
        assert len(events) == 1
        assert events[0].payload["admin_email"] == "admin@cnts.local"
    finally:
        db.close()


def test_disable_all_disables_every_user_with_2fa():
    u1 = create_user_with_2fa(
        email="u1@cnts.local",
        password="pw",
        secret="JBSWY3DPEHPK3PXP",
        recovery_codes=[],
    )
    u2 = create_user_with_2fa(
        email="u2@cnts.local",
        password="pw",
        secret="KRSXG5DSNFXGOIDN",
        recovery_codes=["r1"],
    )

    res = client.post(
        "/admin/auth/2fa/disable-all",
        json={"reason": "reset global"},
        headers={"X-Admin-Token": "dev-admin-token", "X-Admin-Email": "admin@cnts.local"},
    )
    assert res.status_code == 200
    assert res.json()["disabled_count"] == 2
    assert set(res.json()["disabled_user_ids"]) == {str(u1), str(u2)}

    for email in ["u1@cnts.local", "u2@cnts.local"]:
        login = client.post("/auth/login", json={"email": email, "password": "pw"})
        assert login.status_code == 200
        assert login.json()["mfa_required"] is False
