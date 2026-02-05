import datetime as dt
import uuid

from pydantic import BaseModel, ConfigDict


class TraceEventOut(BaseModel):
    id: uuid.UUID
    aggregate_type: str
    aggregate_id: uuid.UUID
    event_type: str
    payload: dict
    created_at: dt.datetime

    model_config = ConfigDict(from_attributes=True)
