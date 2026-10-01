import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel


TypeEIR = Literal[
    "REACTION_FEBRILE",
    "ALLERGIQUE",
    "HEMOLYTIQUE_AIGUE",
    "TACO",
    "TRALI",
    "INFECTION_BACTERIENNE",
    "INCOMPATIBILITE_ABO",
    "AUTRE",
]
Gravite = Literal["GRADE_1", "GRADE_2", "GRADE_3", "GRADE_4"]
Imputabilite = Literal["CERTAINE", "PROBABLE", "POSSIBLE", "DOUTEUSE", "EXCLUE"]
Evolution = Literal["GUERISON_SANS_SEQUELLE", "SEQUELLE", "DECES", "EN_COURS"]
StatutInvestigation = Literal["OUVERTE", "EN_COURS", "CLOTUREE"]


class EIRCreate(BaseModel):
    acte_transfusionnel_id: uuid.UUID
    # Déduits de l'acte transfusionnel s'ils ne sont pas fournis.
    receveur_id: uuid.UUID | None = None
    poche_id: uuid.UUID | None = None
    type_eir: TypeEIR
    gravite: Gravite
    imputabilite: Imputabilite
    delai_apparition_minutes: int | None = None
    symptomes: str | None = None
    conduite_tenue: str | None = None
    evolution: Evolution = "EN_COURS"
    date_declaration: datetime | None = None


class EIRUpdate(BaseModel):
    imputabilite: Imputabilite | None = None
    conduite_tenue: str | None = None
    evolution: Evolution | None = None
    statut_investigation: StatutInvestigation | None = None
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
