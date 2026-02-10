import uuid
from datetime import datetime

from pydantic import BaseModel


class TestNATCreate(BaseModel):
    don_id: uuid.UUID
    type_test: str
    resultat_qualitatif: str = "EN_ATTENTE"
    charge_virale: float | None = None
    unite: str | None = None
    seuil_detection: float | None = None
    lot_reactif: str | None = None
    automate_id: str | None = None


class TestNATUpdate(BaseModel):
    resultat_qualitatif: str | None = None
    charge_virale: float | None = None
    unite: str | None = None
    validateur_id: uuid.UUID | None = None


class TestNATOut(BaseModel):
    id: uuid.UUID
    don_id: uuid.UUID
    type_test: str
    resultat_qualitatif: str
    charge_virale: float | None = None
    unite: str | None = None
    seuil_detection: float | None = None
    lot_reactif: str | None = None
    automate_id: str | None = None
    validateur_id: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
