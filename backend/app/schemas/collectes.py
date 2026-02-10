import uuid
from datetime import datetime

from pydantic import BaseModel


class CampagneCollecteCreate(BaseModel):
    code: str
    nom: str
    site_id: uuid.UUID | None = None
    type_campagne: str
    lieu: str | None = None
    adresse: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    date_debut: datetime
    date_fin: datetime
    objectif_dons: int | None = None
    materiel_notes: str | None = None


class CampagneCollecteUpdate(BaseModel):
    nom: str | None = None
    lieu: str | None = None
    adresse: str | None = None
    date_debut: datetime | None = None
    date_fin: datetime | None = None
    objectif_dons: int | None = None
    materiel_notes: str | None = None


class InscriptionCollecteOut(BaseModel):
    id: uuid.UUID
    campagne_id: uuid.UUID
    donneur_id: uuid.UUID | None = None
    nom: str | None = None
    telephone: str | None = None
    creneau: datetime | None = None
    statut: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CampagneCollecteOut(BaseModel):
    id: uuid.UUID
    code: str
    nom: str
    site_id: uuid.UUID | None = None
    type_campagne: str
    lieu: str | None = None
    adresse: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    date_debut: datetime
    date_fin: datetime
    objectif_dons: int | None = None
    statut: str
    responsable_id: uuid.UUID | None = None
    materiel_notes: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InscriptionCollecteCreate(BaseModel):
    campagne_id: uuid.UUID
    donneur_id: uuid.UUID | None = None
    nom: str | None = None
    telephone: str | None = None
    creneau: datetime | None = None
