import datetime as dt
import uuid

from pydantic import BaseModel, ConfigDict, Field


class ActeTransfusionnelOut(BaseModel):
    id: uuid.UUID
    poche_id: uuid.UUID
    commande_id: uuid.UUID | None
    hopital_id: uuid.UUID | None
    receveur_id: uuid.UUID | None
    date_transfusion: dt.datetime
    created_at: dt.datetime

    din: str | None = None
    type_produit: str | None = None
    lot: str | None = None

    model_config = ConfigDict(from_attributes=True)


class RappelActionCreate(BaseModel):
    validateur_id: uuid.UUID | None = None
    note: str | None = Field(default=None, max_length=2000)


class RappelActionOut(BaseModel):
    id: uuid.UUID
    rappel_id: uuid.UUID
    action: str
    validateur_id: uuid.UUID | None
    note: str | None
    created_at: dt.datetime

    model_config = ConfigDict(from_attributes=True)


class RappelCreate(BaseModel):
    type_cible: str = Field(pattern="^(DIN|LOT)$")
    valeur_cible: str = Field(min_length=2, max_length=64)
    motif: str | None = Field(default=None, max_length=2000)


class RappelAutoCreate(BaseModel):
    type_cible: str = Field(pattern="^(DIN|LOT)$")
    valeur_cible: str = Field(min_length=2, max_length=64)
    motif: str | None = Field(default=None, max_length=2000)
    source: str | None = Field(default=None, max_length=200)


class RappelOut(BaseModel):
    id: uuid.UUID
    type_cible: str
    valeur_cible: str
    motif: str | None
    statut: str
    updated_at: dt.datetime | None = None
    notified_at: dt.datetime | None = None
    confirmed_at: dt.datetime | None = None
    closed_at: dt.datetime | None = None
    created_at: dt.datetime

    model_config = ConfigDict(from_attributes=True)


class ImpactRappelOut(BaseModel):
    poche_id: uuid.UUID
    don_id: uuid.UUID
    din: str
    type_produit: str
    lot: str | None
    statut_distribution: str
    hopital_id: uuid.UUID | None = None
    receveur_id: uuid.UUID | None = None
    commande_id: uuid.UUID | None = None
    date_transfusion: dt.datetime | None = None


class RappelStatutStat(BaseModel):
    statut: str
    total: int


class TransfusionHopitalStat(BaseModel):
    hopital_id: uuid.UUID | None
    total: int


class RappelLotStat(BaseModel):
    lot: str | None
    total: int


class RapportAutoriteOut(BaseModel):
    generated_at: dt.datetime
    rappels_par_statut: list[RappelStatutStat]
    transfusions_par_hopital: list[TransfusionHopitalStat]
    rappels_par_lot: list[RappelLotStat]


class PartenaireEventOut(BaseModel):
    id: uuid.UUID
    aggregate_type: str
    aggregate_id: uuid.UUID
    event_type: str
    payload: dict
    created_at: dt.datetime

    model_config = ConfigDict(from_attributes=True)


class PartenaireFluxOut(BaseModel):
    events: list[PartenaireEventOut]
    next_cursor: str | None = None
