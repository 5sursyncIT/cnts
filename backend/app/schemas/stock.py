import datetime as dt
import uuid

from pydantic import BaseModel, ConfigDict, Field


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

    model_config = ConfigDict(from_attributes=True)


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

    model_config = ConfigDict(from_attributes=True)


class FractionnementDepuisRecetteCreate(BaseModel):
    source_poche_id: uuid.UUID
    idempotency_key: str | None = Field(default=None, max_length=128)


class ProductRuleBase(BaseModel):
    shelf_life_days: int = Field(gt=0, le=3650)
    default_volume_ml: int | None = Field(default=None, gt=0, le=2000)
    min_volume_ml: int | None = Field(default=None, gt=0, le=2000)
    max_volume_ml: int | None = Field(default=None, gt=0, le=2000)
    isbt_product_code: str | None = Field(default=None, max_length=16)


class ProductRuleUpdate(ProductRuleBase):
    pass


class ProductRuleOut(ProductRuleBase):
    type_produit: str = Field(min_length=2, max_length=16)

    model_config = ConfigDict(from_attributes=True)


class ColdChainStorageCreate(BaseModel):
    code: str = Field(min_length=2, max_length=32)
    name: str = Field(min_length=2, max_length=120)
    location: str | None = Field(default=None, max_length=200)
    min_temp: float
    max_temp: float
    is_active: bool = True


class ColdChainStorageUpdate(BaseModel):
    code: str | None = Field(default=None, min_length=2, max_length=32)
    name: str | None = Field(default=None, min_length=2, max_length=120)
    location: str | None = Field(default=None, max_length=200)
    min_temp: float | None = None
    max_temp: float | None = None
    is_active: bool | None = None


class ColdChainStorageOut(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    location: str | None
    min_temp: float
    max_temp: float
    is_active: bool
    created_at: dt.datetime
    updated_at: dt.datetime

    model_config = ConfigDict(from_attributes=True)


class ColdChainReadingCreate(BaseModel):
    storage_id: uuid.UUID
    temperature_c: float
    recorded_at: dt.datetime | None = None
    source: str | None = Field(default=None, max_length=32)
    note: str | None = Field(default=None, max_length=200)


class ColdChainReadingOut(BaseModel):
    id: uuid.UUID
    storage_id: uuid.UUID
    temperature_c: float
    recorded_at: dt.datetime
    source: str | None
    note: str | None
    created_at: dt.datetime

    model_config = ConfigDict(from_attributes=True)


class ColdChainAlertOut(BaseModel):
    storage_id: uuid.UUID
    storage_code: str
    storage_name: str
    min_temp: float
    max_temp: float
    last_temperature_c: float | None
    last_recorded_at: dt.datetime | None
    status: str
