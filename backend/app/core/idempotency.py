import hashlib
import json
import uuid
from dataclasses import dataclass

from fastapi.encoders import jsonable_encoder
from sqlalchemy import DateTime, Integer, JSON, String, UniqueConstraint, func, select
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, Session, mapped_column

from app.db.base import Base


class IdempotencyKey(Base):
    __tablename__ = "idempotency_keys"
    __table_args__ = (UniqueConstraint("scope", "key", name="uq_idempotency_scope_key"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scope: Mapped[str] = mapped_column(String(64), index=True)
    key: Mapped[str] = mapped_column(String(128), index=True)
    request_hash: Mapped[str] = mapped_column(String(64))
    status_code: Mapped[int] = mapped_column(Integer)
    response_json: Mapped[dict] = mapped_column(JSON().with_variant(JSONB(), "postgresql"))
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


@dataclass(frozen=True)
class IdempotencyHit:
    status_code: int
    response_json: dict


def _hash_payload(payload: dict) -> str:
    encoded = jsonable_encoder(payload)
    raw = json.dumps(encoded, sort_keys=True, separators=(",", ":")).encode("utf-8")
    return hashlib.sha256(raw).hexdigest()


def get_idempotent_response(
    db: Session, *, scope: str, key: str, payload: dict
) -> IdempotencyHit | None:
    row = db.execute(
        select(IdempotencyKey).where(IdempotencyKey.scope == scope, IdempotencyKey.key == key)
    ).scalar_one_or_none()
    if row is None:
        return None
    if row.request_hash != _hash_payload(payload):
        return IdempotencyHit(status_code=409, response_json={"detail": "idempotency_key conflict"})
    return IdempotencyHit(status_code=row.status_code, response_json=row.response_json)


def store_idempotent_response(
    db: Session,
    *,
    scope: str,
    key: str,
    payload: dict,
    status_code: int,
    response_json: dict,
) -> None:
    row = IdempotencyKey(
        scope=scope,
        key=key,
        request_hash=_hash_payload(payload),
        status_code=status_code,
        response_json=jsonable_encoder(response_json),
    )
    db.add(row)
