import datetime as dt
import uuid

from pydantic import BaseModel, Field


from app.schemas.users import UserOut


class LoginIn(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1)


class LoginOut(BaseModel):
    mfa_required: bool
    # Personnel sans MFA : challenge_token ne sert qu'à l'enrôlement (/auth/mfa/setup).
    mfa_setup_required: bool = False
    challenge_token: str | None = None
    access_token: str | None = None
    user: UserOut | None = None


class MfaVerifyIn(BaseModel):
    challenge_token: str
    token: str | None = None
    recovery_code: str | None = None


class MfaVerifyOut(BaseModel):
    access_token: str
    user: UserOut


class MfaSetupIn(BaseModel):
    challenge_token: str


class MfaSetupOut(BaseModel):
    secret: str
    otpauth_uri: str


class MfaSetupConfirmIn(BaseModel):
    challenge_token: str
    token: str


class MfaSetupConfirmOut(BaseModel):
    access_token: str
    user: UserOut
    recovery_codes: list[str]


class AdminDisable2faIn(BaseModel):
    reason: str | None = None


class AdminDisable2faOut(BaseModel):
    user_id: uuid.UUID
    disabled_at: dt.datetime
    recovery_codes_revoked: int


class AdminDisable2faAllOut(BaseModel):
    disabled_count: int
    disabled_user_ids: list[uuid.UUID]
