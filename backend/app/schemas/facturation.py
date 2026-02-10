import uuid
from datetime import date, datetime

from pydantic import BaseModel


# ── Tarifs ────────────────────────────────────


class TarifCreate(BaseModel):
    type_produit: str
    prix_unitaire_fcfa: int
    date_debut: date
    date_fin: date | None = None


class TarifOut(BaseModel):
    id: uuid.UUID
    type_produit: str
    prix_unitaire_fcfa: int
    date_debut: date
    date_fin: date | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Factures ──────────────────────────────────


class LigneFactureCreate(BaseModel):
    type_produit: str
    quantite: int
    prix_unitaire_fcfa: int


class FactureCreate(BaseModel):
    numero: str
    commande_id: uuid.UUID | None = None
    hopital_id: uuid.UUID
    date_facture: date
    date_echeance: date | None = None
    lignes: list[LigneFactureCreate]


class LigneFactureOut(BaseModel):
    id: uuid.UUID
    facture_id: uuid.UUID
    type_produit: str
    quantite: int
    prix_unitaire_fcfa: int
    montant_fcfa: int

    model_config = {"from_attributes": True}


class PaiementOut(BaseModel):
    id: uuid.UUID
    facture_id: uuid.UUID
    montant_fcfa: int
    mode_paiement: str
    reference: str | None = None
    date_paiement: date
    created_at: datetime

    model_config = {"from_attributes": True}


class FactureOut(BaseModel):
    id: uuid.UUID
    numero: str
    commande_id: uuid.UUID | None = None
    hopital_id: uuid.UUID
    date_facture: date
    montant_ht_fcfa: int
    montant_ttc_fcfa: int
    statut: str
    date_echeance: date | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Paiements ────────────────────────────────


class PaiementCreate(BaseModel):
    facture_id: uuid.UUID
    montant_fcfa: int
    mode_paiement: str
    reference: str | None = None
    date_paiement: date
