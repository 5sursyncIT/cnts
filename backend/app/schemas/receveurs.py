import datetime as dt
import uuid

from pydantic import BaseModel, ConfigDict, Field


from app.schemas.hopitaux import HopitalOut

class ReceveurCreate(BaseModel):
    nom: str | None = Field(default=None, max_length=200)
    prenom: str | None = Field(default=None, max_length=200)
    sexe: str | None = Field(default=None, max_length=1)
    date_naissance: dt.date | None = None
    adresse: str | None = None
    telephone: str | None = Field(default=None, max_length=32)
    hopital_id: uuid.UUID | None = None
    groupe_sanguin: str | None = Field(default=None, max_length=8)


class ReceveurUpdate(BaseModel):
    nom: str | None = Field(default=None, max_length=200)
    prenom: str | None = Field(default=None, max_length=200)
    sexe: str | None = Field(default=None, max_length=1)
    date_naissance: dt.date | None = None
    adresse: str | None = None
    telephone: str | None = Field(default=None, max_length=32)
    hopital_id: uuid.UUID | None = None
    groupe_sanguin: str | None = Field(default=None, max_length=8)


class ReceveurOut(BaseModel):
    id: uuid.UUID
    nom: str | None
    prenom: str | None
    sexe: str | None
    date_naissance: dt.date | None
    adresse: str | None
    telephone: str | None
    hopital_id: uuid.UUID | None
    hopital: HopitalOut | None = None
    groupe_sanguin: str | None
    created_at: dt.datetime

    model_config = ConfigDict(from_attributes=True)
