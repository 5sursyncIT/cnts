import datetime as dt
import uuid

from pydantic import BaseModel, ConfigDict, Field


class NotificationCreate(BaseModel):
    canal: str = Field(pattern=r"^(EMAIL|SMS|WHATSAPP)$")
    destinataire: str = Field(max_length=320)
    template: str = Field(max_length=64)
    variables: dict = {}
    priorite: str = Field(default="NORMALE", pattern=r"^(BASSE|NORMALE|HAUTE|URGENTE)$")


class NotificationOut(BaseModel):
    id: uuid.UUID
    canal: str
    destinataire: str
    template: str
    variables: dict
    statut: str
    priorite: str
    tentatives: int
    erreur: str | None
    sent_at: dt.datetime | None
    created_at: dt.datetime

    model_config = ConfigDict(from_attributes=True)


class NotificationPreferenceUpdate(BaseModel):
    email_enabled: bool = True
    sms_enabled: bool = True
    whatsapp_enabled: bool = False


class NotificationPreferenceOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    email_enabled: bool
    sms_enabled: bool
    whatsapp_enabled: bool

    model_config = ConfigDict(from_attributes=True)
