import datetime as dt
import uuid

from pydantic import BaseModel


class TraceEventOut(BaseModel):
    id: uuid.UUID
    aggregate_type: str
    aggregate_id: uuid.UUID
    event_type: str
    payload: dict
    created_at: dt.datetime

    class Config:
        from_attributes = True
