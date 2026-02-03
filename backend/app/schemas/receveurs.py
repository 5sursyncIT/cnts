import datetime as dt
import uuid

from pydantic import BaseModel, Field


class ReceveurCreate(BaseModel):
    nom: str | None = Field(default=None, max_length=200)
    groupe_sanguin: str | None = Field(default=None, max_length=8)


class ReceveurOut(BaseModel):
    id: uuid.UUID
    nom: str | None
    groupe_sanguin: str | None
    created_at: dt.datetime

    class Config:
        from_attributes = True
