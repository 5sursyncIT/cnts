import uuid
from datetime import datetime

from pydantic import BaseModel


class ProcedureAphereseCreate(BaseModel):
    don_id: uuid.UUID
    donneur_id: uuid.UUID
    type_apherese: str
    automate: str | None = None
    duree_minutes: int | None = None
    volume_preleve_ml: int | None = None
    volume_restitue_ml: int | None = None
    anticoagulant: str | None = None
    nb_cycles: int | None = None


class ProcedureAphereseUpdate(BaseModel):
    duree_minutes: int | None = None
    volume_preleve_ml: int | None = None
    volume_restitue_ml: int | None = None
    nb_cycles: int | None = None
    statut: str | None = None
    motif_interruption: str | None = None


class ProcedureAphereseOut(BaseModel):
    id: uuid.UUID
    don_id: uuid.UUID
    donneur_id: uuid.UUID
    type_apherese: str
    automate: str | None = None
    duree_minutes: int | None = None
    volume_preleve_ml: int | None = None
    volume_restitue_ml: int | None = None
    anticoagulant: str | None = None
    nb_cycles: int | None = None
    operateur_id: uuid.UUID | None = None
    statut: str
    motif_interruption: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
