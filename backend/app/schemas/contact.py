from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ContactMessageCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    email: EmailStr
    phone: str | None = Field(default=None, max_length=40)
    subject: str = Field(default="Demande d'information", max_length=200)
    message: str = Field(min_length=5, max_length=5000)
    # Pot de miel anti-robots : doit rester vide.
    website: str | None = Field(default=None, max_length=200)


class ContactMessageUpdate(BaseModel):
    status: Literal["NOUVEAU", "TRAITE", "ARCHIVE"]


class ContactMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    email: str
    phone: str | None = None
    subject: str
    message: str
    status: str
    created_at: datetime
    updated_at: datetime


class ContactAck(BaseModel):
    ok: bool = True
