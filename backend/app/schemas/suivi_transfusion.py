import uuid
from datetime import datetime

from pydantic import BaseModel


class SuiviPerTransfusionnelCreate(BaseModel):
    acte_transfusionnel_id: uuid.UUID
    moment: str  # T0, T15, T30, T60, FIN, POST_1H
    temperature: float | None = None
    tension_systolique: int | None = None
    tension_diastolique: int | None = None
    frequence_cardiaque: int | None = None
    frequence_respiratoire: int | None = None
    saturation_o2: float | None = None
    debit_ml_h: int | None = None
    observation: str | None = None
    alerte: bool = False


class SuiviPerTransfusionnelOut(BaseModel):
    id: uuid.UUID
    acte_transfusionnel_id: uuid.UUID
    moment: str
    temperature: float | None = None
    tension_systolique: int | None = None
    tension_diastolique: int | None = None
    frequence_cardiaque: int | None = None
    frequence_respiratoire: int | None = None
    saturation_o2: float | None = None
    debit_ml_h: int | None = None
    observation: str | None = None
    alerte: bool
    operateur_id: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
