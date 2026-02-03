import base64
import datetime as dt
import json
import uuid


def encode_cursor(*, created_at: dt.datetime, event_id: uuid.UUID) -> str:
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=dt.timezone.utc)
    payload = {"created_at": created_at.isoformat(), "id": str(event_id)}
    raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode("utf-8")
    return base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")


def decode_cursor(cursor: str) -> tuple[dt.datetime, uuid.UUID]:
    padded = cursor + "=" * (-len(cursor) % 4)
    raw = base64.urlsafe_b64decode(padded.encode("ascii"))
    data = json.loads(raw.decode("utf-8"))
    created_at = dt.datetime.fromisoformat(data["created_at"])
    event_id = uuid.UUID(data["id"])
    return created_at, event_id
