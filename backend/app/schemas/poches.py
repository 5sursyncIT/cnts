import datetime as dt
import uuid

from pydantic import BaseModel, Field


class PocheCreate(BaseModel):
    """Créer une nouvelle poche (fractionnement ou produit dérivé)."""

    don_id: uuid.UUID
    type_produit: str = Field(
        min_length=2,
        max_length=16,
        description="Type de produit: ST (Sang Total), CGR, PFC, CP",
    )
    date_peremption: dt.date
    emplacement_stock: str = Field(min_length=1, max_length=64)


class PocheUpdate(BaseModel):
    """Mettre à jour une poche existante."""

    emplacement_stock: str | None = Field(default=None, min_length=1, max_length=64)
    groupe_sanguin: str | None = Field(default=None, max_length=8)
    code_produit_isbt: str | None = Field(default=None, max_length=32)
    lot: str | None = Field(default=None, max_length=32)
    division: int | None = Field(default=None, ge=0, le=999)
    statut_distribution: str | None = Field(
        default=None,
        pattern="^(NON_DISTRIBUABLE|DISPONIBLE|RESERVE|DISTRIBUE)$",
    )


class PocheOut(BaseModel):
    """Représentation d'une poche."""

    id: uuid.UUID
    don_id: uuid.UUID
    type_produit: str
    groupe_sanguin: str | None = None
    code_produit_isbt: str | None = None
    lot: str | None = None
    division: int | None = None
    date_peremption: dt.date
    emplacement_stock: str
    statut_distribution: str
    created_at: dt.datetime

    class Config:
        from_attributes = True


class StockSummary(BaseModel):
    """Résumé du stock par type de produit."""

    type_produit: str
    quantite_disponible: int
    quantite_reservee: int
    quantite_totale: int


class PochePeremptionAlert(BaseModel):
    """Alerte de péremption pour une poche."""

    id: uuid.UUID
    don_id: uuid.UUID
    din: str
    type_produit: str
    date_peremption: dt.date
    jours_restants: int
    emplacement_stock: str
    statut_distribution: str
