import datetime as dt
import uuid

from pydantic import BaseModel, Field


class SyncPullEventOut(BaseModel):
    id: uuid.UUID
    aggregate_type: str
    aggregate_id: uuid.UUID
    event_type: str
    payload: dict
    created_at: dt.datetime

    class Config:
        from_attributes = True


class SyncPullOut(BaseModel):
    events: list[SyncPullEventOut]
    next_cursor: str | None = None


class SyncPushEventIn(BaseModel):
    client_event_id: str = Field(min_length=1, max_length=128)
    type: str = Field(min_length=1, max_length=64)
    payload: dict = Field(default_factory=dict)
    occurred_at: dt.datetime | None = None


class SyncPushIn(BaseModel):
    device_id: str = Field(min_length=1, max_length=128)
    events: list[SyncPushEventIn] = Field(min_length=1, max_length=500)


class SyncPushEventResult(BaseModel):
    client_event_id: str
    status: str
    error_code: str | None = None
    error_message: str | None = None
    response: dict | None = None


class SyncPushOut(BaseModel):
    device_id: str
    results: list[SyncPushEventResult]
