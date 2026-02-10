import uuid
from datetime import datetime

from pydantic import BaseModel


class LivraisonCreate(BaseModel):
    commande_id: uuid.UUID | None = None
    transfert_id: uuid.UUID | None = None
    hopital_id: uuid.UUID | None = None
    transporteur_nom: str | None = None
    vehicule: str | None = None
    temperature_depart: float | None = None
    note: str | None = None


class LivraisonUpdate(BaseModel):
    statut: str | None = None
    temperature_arrivee: float | None = None
    heure_arrivee: datetime | None = None
    signe_par: str | None = None
    note: str | None = None


class ReleveTemperatureOut(BaseModel):
    id: uuid.UUID
    livraison_id: uuid.UUID
    temperature_c: float
    recorded_at: datetime
    latitude: float | None = None
    longitude: float | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class LivraisonOut(BaseModel):
    id: uuid.UUID
    commande_id: uuid.UUID | None = None
    transfert_id: uuid.UUID | None = None
    hopital_id: uuid.UUID | None = None
    statut: str
    transporteur_nom: str | None = None
    vehicule: str | None = None
    temperature_depart: float | None = None
    temperature_arrivee: float | None = None
    heure_depart: datetime | None = None
    heure_arrivee: datetime | None = None
    signe_par: str | None = None
    note: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ReleveTemperatureCreate(BaseModel):
    livraison_id: uuid.UUID
    temperature_c: float
    recorded_at: datetime
    latitude: float | None = None
    longitude: float | None = None
