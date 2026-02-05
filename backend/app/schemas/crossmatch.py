import datetime as dt
import uuid

from pydantic import BaseModel, ConfigDict, Field


class CrossMatchCreate(BaseModel):
    poche_id: uuid.UUID
    receveur_id: uuid.UUID
    resultat: str = Field(pattern="^(COMPATIBLE|INCOMPATIBLE)$")
    validateur_id: uuid.UUID | None = None


class CrossMatchOut(BaseModel):
    id: uuid.UUID
    poche_id: uuid.UUID
    receveur_id: uuid.UUID
    resultat: str
    validateur_id: uuid.UUID | None
    created_at: dt.datetime

    model_config = ConfigDict(from_attributes=True)
