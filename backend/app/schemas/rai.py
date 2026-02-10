import uuid
from datetime import datetime

from pydantic import BaseModel


class RAICreate(BaseModel):
    receveur_id: uuid.UUID
    commande_id: uuid.UUID | None = None
    date_prelevement: datetime
    resultat: str = "EN_ATTENTE"
    anticorps_identifies: dict | None = None
    validite_heures: int = 72
    note: str | None = None


class RAIUpdate(BaseModel):
    resultat: str | None = None
    anticorps_identifies: dict | None = None
    validateur_id: uuid.UUID | None = None
    note: str | None = None


class RAIOut(BaseModel):
    id: uuid.UUID
    receveur_id: uuid.UUID
    commande_id: uuid.UUID | None = None
    date_prelevement: datetime
    resultat: str
    anticorps_identifies: dict | None = None
    validite_heures: int
    validateur_id: uuid.UUID | None = None
    note: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
