import datetime as dt
import uuid

from pydantic import BaseModel, Field


class LoginIn(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1)


class LoginOut(BaseModel):
    mfa_required: bool
    challenge_token: str | None = None
    access_token: str | None = None


class MfaVerifyIn(BaseModel):
    challenge_token: str
    token: str | None = None
    recovery_code: str | None = None


class MfaVerifyOut(BaseModel):
    access_token: str


class AdminDisable2faIn(BaseModel):
    reason: str | None = None


class AdminDisable2faOut(BaseModel):
    user_id: uuid.UUID
    disabled_at: dt.datetime
    recovery_codes_revoked: int


class AdminDisable2faAllOut(BaseModel):
    disabled_count: int
    disabled_user_ids: list[uuid.UUID]
