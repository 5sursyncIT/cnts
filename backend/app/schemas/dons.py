import datetime as dt
import uuid

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.donneurs import DonneurOut
from app.schemas.poches import PocheOut


class DonCreate(BaseModel):
    donneur_id: uuid.UUID
    date_don: dt.date
    type_don: str = Field(min_length=2, max_length=32)
    idempotency_key: str | None = Field(default=None, max_length=128)
    # Permet à un personnel médical de passer outre le contrôle d'éligibilité
    # (délai inter-don / âge) en connaissance de cause. Tracé via l'événement.
    ignorer_eligibilite: bool = False
    motif_derogation: str | None = Field(default=None, min_length=10, max_length=1000)

    @model_validator(mode="after")
    def verifier_derogation(self):
        if self.ignorer_eligibilite and not (self.motif_derogation or "").strip():
            raise ValueError("Un motif de dérogation est requis")
        return self


class DonOut(BaseModel):
    id: uuid.UUID
    donneur_id: uuid.UUID
    donneur: DonneurOut | None = None
    din: str
    date_don: dt.date
    type_don: str
    statut_qualification: str
    created_at: dt.datetime

    model_config = ConfigDict(from_attributes=True)


class DonDetailOut(DonOut):
    poches: list[PocheOut]


class EtiquetteOut(BaseModel):
    din: str
    groupe_sanguin: str | None = None
