import datetime as dt
import uuid

from pydantic import BaseModel, Field


class LigneCommandeCreate(BaseModel):
    type_produit: str = Field(min_length=2, max_length=16)
    groupe_sanguin: str | None = Field(default=None, max_length=8)
    quantite: int = Field(ge=1, le=500)


class CommandeCreate(BaseModel):
    hopital_id: uuid.UUID
    date_livraison_prevue: dt.date | None = None
    lignes: list[LigneCommandeCreate] = Field(min_length=1, max_length=50)


class LigneCommandeOut(BaseModel):
    id: uuid.UUID
    type_produit: str
    groupe_sanguin: str | None
    quantite: int

    class Config:
        from_attributes = True


class CommandeOut(BaseModel):
    id: uuid.UUID
    hopital_id: uuid.UUID
    statut: str
    date_demande: dt.datetime
    date_livraison_prevue: dt.date | None
    created_at: dt.datetime
    updated_at: dt.datetime
    lignes: list[LigneCommandeOut]

    class Config:
        from_attributes = True


class CommandeValiderPayload(BaseModel):
    duree_reservation_heures: int = Field(default=24, ge=1, le=168)


class AffectationLigneReceveur(BaseModel):
    ligne_commande_id: uuid.UUID
    receveur_id: uuid.UUID
    quantite: int = Field(ge=1, le=500)


class CommandeAffecterPayload(BaseModel):
    affectations: list[AffectationLigneReceveur] = Field(min_length=1, max_length=200)


class ReservationOut(BaseModel):
    poche_id: uuid.UUID
    type_produit: str
    groupe_sanguin: str | None
    date_peremption: dt.date
    ligne_commande_id: uuid.UUID | None = None
    receveur_id: uuid.UUID | None = None


class CommandeValiderOut(BaseModel):
    commande_id: uuid.UUID
    statut: str
    reservations: list[ReservationOut]


class CommandeServirPayload(BaseModel):
    pass
