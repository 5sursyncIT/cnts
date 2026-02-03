import datetime as dt
import uuid

from pydantic import BaseModel, Field


class PocheOut(BaseModel):
    id: uuid.UUID
    don_id: uuid.UUID
    source_poche_id: uuid.UUID | None
    type_produit: str
    volume_ml: int | None
    date_peremption: dt.date
    emplacement_stock: str
    statut_stock: str
    statut_distribution: str

    class Config:
        from_attributes = True


class FractionnementComposant(BaseModel):
    type_produit: str = Field(min_length=2, max_length=16)
    volume_ml: int | None = Field(default=None, gt=0, le=2000)


class FractionnementCreate(BaseModel):
    source_poche_id: uuid.UUID
    composants: list[FractionnementComposant]
    idempotency_key: str | None = Field(default=None, max_length=128)


class FractionnementOut(BaseModel):
    source_poche_id: uuid.UUID
    perte_ml: int | None = None
    poches_creees: list[PocheOut]


class RecetteComposant(BaseModel):
    type_produit: str = Field(min_length=2, max_length=16)
    volume_ml: int | None = Field(default=None, gt=0, le=2000)
    quantite: int = Field(default=1, ge=1, le=24)


class RecetteFractionnementUpsert(BaseModel):
    libelle: str = Field(min_length=2, max_length=120)
    actif: bool = True
    site_code: str | None = Field(default=None, max_length=32)
    type_source: str = Field(default="ST", min_length=2, max_length=16)
    composants: list[RecetteComposant] = Field(min_length=1, max_length=24)


class RecetteFractionnementOut(RecetteFractionnementUpsert):
    code: str = Field(min_length=2, max_length=32)

    class Config:
        from_attributes = True


class FractionnementDepuisRecetteCreate(BaseModel):
    source_poche_id: uuid.UUID
    idempotency_key: str | None = Field(default=None, max_length=128)
