import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


# ── Tarifs ────────────────────────────────────


class TarifCreate(BaseModel):
    type_produit: str
    prix_unitaire_fcfa: int = Field(ge=0)
    date_debut: date
    date_fin: date | None = None

    @model_validator(mode="after")
    def dates_coherentes(self):
        if self.date_fin is not None and self.date_fin < self.date_debut:
            raise ValueError("La fin du tarif précède son début")
        return self


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
    quantite: int = Field(ge=1)
    prix_unitaire_fcfa: int = Field(ge=0)


class FactureCreate(BaseModel):
    numero: str
    commande_id: uuid.UUID | None = None
    hopital_id: uuid.UUID
    date_facture: date
    date_echeance: date | None = None
    lignes: list[LigneFactureCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def dates_coherentes(self):
        if self.date_echeance is not None and self.date_echeance < self.date_facture:
            raise ValueError("L'échéance précède la date de facture")
        return self


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
    montant_fcfa: int = Field(gt=0)
    mode_paiement: Literal["VIREMENT", "CHEQUE", "ESPECES", "MOBILE_MONEY"]
    reference: str | None = None
    date_paiement: date
