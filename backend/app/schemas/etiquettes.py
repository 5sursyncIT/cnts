import datetime as dt
import uuid

from pydantic import BaseModel, Field


class EtiquetteProduitOut(BaseModel):
    poche_id: uuid.UUID
    don_id: uuid.UUID
    din: str
    type_produit: str
    code_produit_isbt: str | None = None
    lot: str | None = None
    division: int | None = None
    date_prelevement: dt.date
    date_peremption: dt.date
    groupe_sanguin: str | None = None
    statut_stock: str
    statut_distribution: str
    payload: dict = Field(default_factory=dict)
