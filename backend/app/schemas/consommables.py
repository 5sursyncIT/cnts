import uuid
from datetime import date, datetime

from pydantic import BaseModel


class ConsommableCreate(BaseModel):
    code: str
    designation: str
    categorie: str
    unite: str
    seuil_alerte: int | None = None
    seuil_critique: int | None = None
    fournisseur: str | None = None


class ConsommableUpdate(BaseModel):
    designation: str | None = None
    seuil_alerte: int | None = None
    seuil_critique: int | None = None
    fournisseur: str | None = None


class ConsommableOut(BaseModel):
    id: uuid.UUID
    code: str
    designation: str
    categorie: str
    unite: str
    seuil_alerte: int | None = None
    seuil_critique: int | None = None
    fournisseur: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class LotConsommableCreate(BaseModel):
    consommable_id: uuid.UUID
    numero_lot: str
    date_reception: date
    date_peremption: date | None = None
    quantite_recue: int
    fournisseur: str | None = None
    certificat_url: str | None = None
    site_id: uuid.UUID | None = None


class LotConsommableOut(BaseModel):
    id: uuid.UUID
    consommable_id: uuid.UUID
    numero_lot: str
    date_reception: date
    date_peremption: date | None = None
    quantite_recue: int
    quantite_restante: int
    fournisseur: str | None = None
    certificat_url: str | None = None
    site_id: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class MouvementConsommableCreate(BaseModel):
    lot_id: uuid.UUID
    type_mouvement: str
    quantite: int
    motif: str | None = None


class MouvementConsommableOut(BaseModel):
    id: uuid.UUID
    lot_id: uuid.UUID
    type_mouvement: str
    quantite: int
    motif: str | None = None
    operateur_id: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
