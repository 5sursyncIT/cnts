import uuid
from datetime import date, datetime

from pydantic import BaseModel


class EquipementCreate(BaseModel):
    code_inventaire: str
    nom: str
    categorie: str
    marque: str | None = None
    modele: str | None = None
    numero_serie: str | None = None
    site_id: uuid.UUID | None = None
    localisation: str | None = None
    date_mise_service: date | None = None


class EquipementUpdate(BaseModel):
    nom: str | None = None
    localisation: str | None = None
    statut: str | None = None
    date_prochaine_maintenance: date | None = None
    date_prochaine_calibration: date | None = None


class EquipementOut(BaseModel):
    id: uuid.UUID
    code_inventaire: str
    nom: str
    categorie: str
    marque: str | None = None
    modele: str | None = None
    numero_serie: str | None = None
    site_id: uuid.UUID | None = None
    localisation: str | None = None
    date_mise_service: date | None = None
    date_prochaine_maintenance: date | None = None
    date_prochaine_calibration: date | None = None
    statut: str
    created_at: datetime

    model_config = {"from_attributes": True}


class InterventionEquipementCreate(BaseModel):
    equipement_id: uuid.UUID
    type_intervention: str
    date_intervention: date
    technicien: str | None = None
    description: str | None = None
    resultat: str
    prochaine_date: date | None = None


class InterventionEquipementOut(BaseModel):
    id: uuid.UUID
    equipement_id: uuid.UUID
    type_intervention: str
    date_intervention: date
    technicien: str | None = None
    description: str | None = None
    resultat: str
    prochaine_date: date | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
