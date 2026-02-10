import uuid
from datetime import datetime

from pydantic import BaseModel


class CULMCreate(BaseModel):
    poche_id: uuid.UUID
    receveur_id: uuid.UUID
    commande_id: uuid.UUID | None = None
    identite_patient_verifiee: bool
    groupe_patient_controle: str | None = None
    groupe_poche_controle: str | None = None
    concordance_abo: bool
    beth_vincent: str | None = None
    simonin: str | None = None
    resultat: str
    motif_non_conformite: str | None = None
    temperature: float | None = None
    tension_systolique: int | None = None
    tension_diastolique: int | None = None
    frequence_cardiaque: int | None = None
    lieu: str | None = None


class CULMOut(BaseModel):
    id: uuid.UUID
    poche_id: uuid.UUID
    receveur_id: uuid.UUID
    commande_id: uuid.UUID | None = None
    identite_patient_verifiee: bool
    groupe_patient_controle: str | None = None
    groupe_poche_controle: str | None = None
    concordance_abo: bool
    beth_vincent: str | None = None
    simonin: str | None = None
    resultat: str
    motif_non_conformite: str | None = None
    temperature: float | None = None
    tension_systolique: int | None = None
    tension_diastolique: int | None = None
    frequence_cardiaque: int | None = None
    operateur_id: uuid.UUID | None = None
    lieu: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
