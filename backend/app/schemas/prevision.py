import uuid
from datetime import date, datetime

from pydantic import BaseModel


class SeuilAlerteCreate(BaseModel):
    type_produit: str
    groupe_sanguin: str | None = None
    site_id: uuid.UUID | None = None
    seuil_critique: int
    seuil_alerte: int
    seuil_confort: int


class SeuilAlerteUpdate(BaseModel):
    seuil_critique: int | None = None
    seuil_alerte: int | None = None
    seuil_confort: int | None = None
    is_active: bool | None = None


class SeuilAlerteOut(BaseModel):
    id: uuid.UUID
    type_produit: str
    groupe_sanguin: str | None = None
    site_id: uuid.UUID | None = None
    seuil_critique: int
    seuil_alerte: int
    seuil_confort: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PrevisionStockOut(BaseModel):
    id: uuid.UUID
    type_produit: str
    groupe_sanguin: str | None = None
    site_id: uuid.UUID | None = None
    date_prevision: date
    quantite_prevue: int
    quantite_reelle: int | None = None
    methode: str
    created_at: datetime

    model_config = {"from_attributes": True}
