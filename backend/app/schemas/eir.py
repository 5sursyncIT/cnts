import uuid
from datetime import datetime

from pydantic import BaseModel


class EIRCreate(BaseModel):
    acte_transfusionnel_id: uuid.UUID
    receveur_id: uuid.UUID
    poche_id: uuid.UUID
    type_eir: str
    gravite: str
    imputabilite: str
    delai_apparition_minutes: int | None = None
    symptomes: str | None = None
    conduite_tenue: str | None = None
    evolution: str = "EN_COURS"
    date_declaration: datetime | None = None


class EIRUpdate(BaseModel):
    imputabilite: str | None = None
    conduite_tenue: str | None = None
    evolution: str | None = None
    statut_investigation: str | None = None
    conclusion: str | None = None


class EIROut(BaseModel):
    id: uuid.UUID
    acte_transfusionnel_id: uuid.UUID
    receveur_id: uuid.UUID
    poche_id: uuid.UUID
    type_eir: str
    gravite: str
    imputabilite: str
    delai_apparition_minutes: int | None = None
    symptomes: str | None = None
    conduite_tenue: str | None = None
    evolution: str
    declarant_id: uuid.UUID | None = None
    date_declaration: datetime | None = None
    statut_investigation: str
    conclusion: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
