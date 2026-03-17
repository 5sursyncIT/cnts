import uuid

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.audit.events import TraceEvent
from app.core.passwords import hash_password, hash_recovery_code
from app.core.totp import generate_totp
from app.db.models import UserAccount, UserRecoveryCode


def _create_user_with_2fa(
    db_session: Session, *, email: str, password: str, secret: str, recovery_codes: list[str]
):
    user = UserAccount(
        id=uuid.uuid4(),
        email=email,
        password_hash=hash_password(password),
        is_active=True,
        mfa_enabled=True,
        mfa_secret=secret,
    )
    db_session.add(user)
    for code in recovery_codes:
        db_session.add(
            UserRecoveryCode(
                id=uuid.uuid4(),
                user_id=user.id,
                code_hash=hash_recovery_code(code, secret="dev-only-change-me"),
            )
        )
    db_session.commit()
    return user.id


def test_disable_2fa_is_effective_and_irreversible(client: TestClient, db_session: Session):
    user_id = _create_user_with_2fa(
        db_session,
        email="agent@cnts.local",
        password="pw",
        secret="JBSWY3DPEHPK3PXP",
        recovery_codes=["r1", "r2"],
    )

    login_res = client.post("/api/auth/login", json={"email": "agent@cnts.local", "password": "pw"})
    assert login_res.status_code == 200
    assert login_res.json()["mfa_required"] is True
    challenge = login_res.json()["challenge_token"]

    token = generate_totp("JBSWY3DPEHPK3PXP")
    ok_res = client.post(
        "/api/auth/mfa/verify", json={"challenge_token": challenge, "token": token}
    )
    assert ok_res.status_code == 200
    assert "access_token" in ok_res.json()

    disable_res = client.post(
        f"/api/admin/auth/2fa/disable/{user_id}",
        json={"reason": "incident"},
        headers={"X-Admin-Token": "dev-admin-token", "X-Admin-Email": "admin@cnts.local"},
    )
    assert disable_res.status_code == 200
    assert disable_res.json()["user_id"] == str(user_id)
    assert disable_res.json()["recovery_codes_revoked"] == 2

    login_res2 = client.post(
        "/api/auth/login", json={"email": "agent@cnts.local", "password": "pw"}
    )
    assert login_res2.status_code == 200
    assert login_res2.json()["mfa_required"] is False
    assert "access_token" in login_res2.json()

    blocked_res = client.post(
        "/api/auth/mfa/verify", json={"challenge_token": challenge, "token": token}
    )
    assert blocked_res.status_code == 400
    assert blocked_res.json()["detail"] == "2fa_not_enabled"

    stmt = select(UserRecoveryCode).where(UserRecoveryCode.user_id == user_id)
    assert list(db_session.execute(stmt).scalars()) == []
    audit_stmt = (
        select(TraceEvent)
        .where(TraceEvent.aggregate_type == "user")
        .where(TraceEvent.aggregate_id == user_id)
        .where(TraceEvent.event_type == "auth.2fa_disabled")
    )
    events = list(db_session.execute(audit_stmt).scalars())
    assert len(events) == 1
    assert events[0].payload["admin_email"] == "admin@cnts.local"


def test_disable_all_disables_every_user_with_2fa(client: TestClient, db_session: Session):
    u1 = _create_user_with_2fa(
        db_session,
        email="u1@cnts.local",
        password="pw",
        secret="JBSWY3DPEHPK3PXP",
        recovery_codes=[],
    )
    u2 = _create_user_with_2fa(
        db_session,
        email="u2@cnts.local",
        password="pw",
        secret="KRSXG5DSNFXGOIDN",
        recovery_codes=["r1"],
    )

    res = client.post(
        "/api/admin/auth/2fa/disable-all",
        json={"reason": "reset global"},
        headers={"X-Admin-Token": "dev-admin-token", "X-Admin-Email": "admin@cnts.local"},
    )
    assert res.status_code == 200
    assert res.json()["disabled_count"] == 2
    assert set(res.json()["disabled_user_ids"]) == {str(u1), str(u2)}

    for email in ["u1@cnts.local", "u2@cnts.local"]:
        login = client.post("/api/auth/login", json={"email": email, "password": "pw"})
        assert login.status_code == 200
        assert login.json()["mfa_required"] is False
