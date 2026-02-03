import datetime as dt
import uuid

from pydantic import BaseModel, Field


class HopitalCreate(BaseModel):
    nom: str = Field(min_length=2, max_length=200)
    adresse: str | None = Field(default=None, max_length=2000)
    contact: str | None = Field(default=None, max_length=2000)
    convention_actif: bool = True


class HopitalOut(BaseModel):
    id: uuid.UUID
    nom: str
    adresse: str | None
    contact: str | None
    convention_actif: bool
    created_at: dt.datetime

    class Config:
        from_attributes = True
