import datetime as dt
import uuid

from pydantic import BaseModel, ConfigDict, Field


class SiteCreate(BaseModel):
    code: str = Field(min_length=2, max_length=16)
    nom: str = Field(min_length=2, max_length=200)
    type_site: str = Field(pattern=r"^(CENTRAL|REGIONAL|POSTE)$")
    adresse: str | None = None
    region: str | None = None
    telephone: str | None = None
    email: str | None = None
    responsable_nom: str | None = None


class SiteUpdate(BaseModel):
    nom: str | None = Field(default=None, min_length=2, max_length=200)
    type_site: str | None = Field(default=None, pattern=r"^(CENTRAL|REGIONAL|POSTE)$")
    adresse: str | None = None
    region: str | None = None
    telephone: str | None = None
    email: str | None = None
    responsable_nom: str | None = None
    is_active: bool | None = None


class SiteOut(BaseModel):
    id: uuid.UUID
    code: str
    nom: str
    type_site: str
    adresse: str | None
    region: str | None
    telephone: str | None
    email: str | None
    responsable_nom: str | None
    is_active: bool
    created_at: dt.datetime
    updated_at: dt.datetime

    model_config = ConfigDict(from_attributes=True)


class TransfertCreate(BaseModel):
    site_destination_id: uuid.UUID
    motif: str | None = None
    poche_ids: list[uuid.UUID] = Field(min_length=1, max_length=200)


class LigneTransfertOut(BaseModel):
    id: uuid.UUID
    poche_id: uuid.UUID
    statut_reception: str | None
    note: str | None

    model_config = ConfigDict(from_attributes=True)


class TransfertOut(BaseModel):
    id: uuid.UUID
    site_source_id: uuid.UUID
    site_destination_id: uuid.UUID
    statut: str
    motif: str | None
    date_expedition: dt.datetime | None
    date_reception: dt.datetime | None
    transporteur: str | None
    temperature_depart: float | None
    temperature_arrivee: float | None
    created_at: dt.datetime
    lignes: list[LigneTransfertOut]

    model_config = ConfigDict(from_attributes=True)
