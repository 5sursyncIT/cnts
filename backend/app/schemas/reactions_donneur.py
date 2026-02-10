import uuid
from datetime import datetime

from pydantic import BaseModel


class ReactionAdverseDonneurCreate(BaseModel):
    don_id: uuid.UUID
    donneur_id: uuid.UUID
    type_reaction: str
    gravite: str
    moment: str
    description: str | None = None
    prise_en_charge: str | None = None
    evolution: str = "EN_COURS"


class ReactionAdverseDonneurUpdate(BaseModel):
    prise_en_charge: str | None = None
    evolution: str | None = None


class ReactionAdverseDonneurOut(BaseModel):
    id: uuid.UUID
    don_id: uuid.UUID
    donneur_id: uuid.UUID
    type_reaction: str
    gravite: str
    moment: str
    description: str | None = None
    prise_en_charge: str | None = None
    evolution: str
    declarant_id: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
