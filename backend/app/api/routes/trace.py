import datetime as dt
import uuid

from fastapi import APIRouter, Depends, Query
from fastapi import HTTPException
from sqlalchemy import String, cast, select
from sqlalchemy.orm import Session

from app.audit.events import TraceEvent
from app.db.session import get_db
from app.schemas.trace import TraceEventOut

router = APIRouter(prefix="/trace")


@router.get("/events/{event_id}", response_model=TraceEventOut)
def get_trace_event(event_id: uuid.UUID, db: Session = Depends(get_db)) -> TraceEvent:
    row = db.get(TraceEvent, event_id)
    if row is None:
        raise HTTPException(status_code=404, detail="event introuvable")
    return row


@router.get("/events", response_model=list[TraceEventOut])
def list_trace_events(
    aggregate_type: str | None = Query(default=None, max_length=32),
    aggregate_id: uuid.UUID | None = Query(default=None),
    event_type: str | None = Query(default=None, max_length=64),
    din: str | None = Query(default=None, max_length=32),
    before: dt.datetime | None = Query(default=None, description="Pagination: created_at < before (UTC)"),
    limit: int = Query(default=200, le=1000),
    db: Session = Depends(get_db),
) -> list[TraceEvent]:
    stmt = select(TraceEvent)
    if aggregate_type is not None:
        stmt = stmt.where(TraceEvent.aggregate_type == aggregate_type)
    if aggregate_id is not None:
        stmt = stmt.where(TraceEvent.aggregate_id == aggregate_id)
    if event_type is not None:
        stmt = stmt.where(TraceEvent.event_type == event_type)
    if before is not None:
        stmt = stmt.where(TraceEvent.created_at < before)
    if din is not None:
        dialect = db.get_bind().dialect.name
        if dialect == "postgresql":
            stmt = stmt.where(TraceEvent.payload["din"].astext == din)  # type: ignore[attr-defined]
        else:
            stmt = stmt.where(cast(TraceEvent.payload, String).like(f'%\"din\": \"{din}\"%'))
    stmt = stmt.order_by(TraceEvent.created_at.desc()).limit(limit)
    return list(db.execute(stmt).scalars())
