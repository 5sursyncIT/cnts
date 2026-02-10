import datetime as dt
import uuid

from pydantic import BaseModel, ConfigDict, Field


class DonneurCreate(BaseModel):
    cni: str = Field(min_length=3, max_length=64)
    nom: str = Field(min_length=1, max_length=120)
    prenom: str = Field(min_length=1, max_length=120)
    sexe: str = Field(pattern="^[HF]$")
    date_naissance: dt.date | None = None
    groupe_sanguin: str | None = None
    adresse: str | None = None
    region: str | None = None
    departement: str | None = None
    telephone: str | None = None
    email: str | None = None
    profession: str | None = None


class DonneurUpdate(BaseModel):
    cni: str | None = Field(default=None, min_length=3, max_length=64)
    nom: str | None = Field(default=None, min_length=1, max_length=120)
    prenom: str | None = Field(default=None, min_length=1, max_length=120)
    sexe: str | None = Field(default=None, pattern="^[HF]$")
    date_naissance: dt.date | None = None
    groupe_sanguin: str | None = None
    adresse: str | None = None
    region: str | None = None
    departement: str | None = None
    telephone: str | None = None
    email: str | None = None
    profession: str | None = None


class DonneurOut(BaseModel):
    """Output schema for Donneur - CNI is NOT exposed for privacy/GDPR compliance."""
    id: uuid.UUID
    cni_hash: str  # Only the hash is exposed, never the original CNI
    nom: str
    prenom: str
    sexe: str
    date_naissance: dt.date | None = None
    groupe_sanguin: str | None = None
    adresse: str | None = None
    region: str | None = None
    departement: str | None = None
    telephone: str | None = None
    email: str | None = None
    profession: str | None = None
    dernier_don: dt.date | None
    numero_carte: str | None = None

    model_config = ConfigDict(from_attributes=True)


class EligibiliteOut(BaseModel):
    eligible: bool
    eligible_le: dt.date | None
    raison: str | None = None
    delai_jours: int | None = None
