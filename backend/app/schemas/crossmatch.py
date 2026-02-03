import datetime as dt
import uuid

from pydantic import BaseModel, Field


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

    class Config:
        from_attributes = True
