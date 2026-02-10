import uuid
from datetime import datetime

from pydantic import BaseModel


class PhenotypageCreate(BaseModel):
    donneur_id: uuid.UUID
    don_id: uuid.UUID | None = None
    systeme: str
    antigenes: dict
    phenotype_complet: str | None = None
    methode: str | None = None


class PhenotypageOut(BaseModel):
    id: uuid.UUID
    donneur_id: uuid.UUID
    don_id: uuid.UUID | None = None
    systeme: str
    antigenes: dict
    phenotype_complet: str | None = None
    methode: str | None = None
    validateur_id: uuid.UUID | None = None
    is_confirmed: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class RegistreGroupeRareCreate(BaseModel):
    donneur_id: uuid.UUID
    phenotype_resume: str
    rarete: str
    note_clinique: str | None = None
    disponible: bool = True


class RegistreGroupeRareUpdate(BaseModel):
    phenotype_resume: str | None = None
    rarete: str | None = None
    note_clinique: str | None = None
    disponible: bool | None = None


class RegistreGroupeRareOut(BaseModel):
    id: uuid.UUID
    donneur_id: uuid.UUID
    phenotype_resume: str
    rarete: str
    note_clinique: str | None = None
    dernier_contact: datetime | None = None
    disponible: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
