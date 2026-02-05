import datetime as dt
import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.donneurs import DonneurOut


class DonCreate(BaseModel):
    donneur_id: uuid.UUID
    date_don: dt.date
    type_don: str = Field(min_length=2, max_length=32)
    idempotency_key: str | None = Field(default=None, max_length=128)


class DonOut(BaseModel):
    id: uuid.UUID
    donneur_id: uuid.UUID
    donneur: DonneurOut | None = None
    din: str
    date_don: dt.date
    type_don: str
    statut_qualification: str

    model_config = ConfigDict(from_attributes=True)


class EtiquetteOut(BaseModel):
    din: str
    groupe_sanguin: str | None = None
