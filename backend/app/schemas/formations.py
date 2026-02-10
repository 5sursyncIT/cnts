import uuid
from datetime import date, datetime

from pydantic import BaseModel


class FormationCreate(BaseModel):
    code: str
    titre: str
    description: str | None = None
    categorie: str | None = None
    duree_heures: int | None = None
    periodicite_mois: int | None = None
    is_obligatoire: bool = False


class FormationUpdate(BaseModel):
    titre: str | None = None
    description: str | None = None
    duree_heures: int | None = None
    periodicite_mois: int | None = None
    is_obligatoire: bool | None = None


class FormationOut(BaseModel):
    id: uuid.UUID
    code: str
    titre: str
    description: str | None = None
    categorie: str | None = None
    duree_heures: int | None = None
    periodicite_mois: int | None = None
    is_obligatoire: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class HabilitationCreate(BaseModel):
    user_id: uuid.UUID
    formation_id: uuid.UUID
    date_obtention: date
    date_expiration: date | None = None
    formateur: str | None = None
    note: str | None = None


class HabilitationOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    formation_id: uuid.UUID
    date_obtention: date
    date_expiration: date | None = None
    statut: str
    formateur: str | None = None
    note: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
