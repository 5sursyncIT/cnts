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
    """Schéma de sortie d'un donneur.

    Ni le CNI ni son empreinte (``cni_hash``) ne sont exposés : le hash est un
    identifiant pseudonyme stable qui ne doit jamais quitter le backend
    (corrélation inter-systèmes, attaque par dictionnaire si la clé fuite).
    """

    id: uuid.UUID
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
    created_at: dt.datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class EligibiliteOut(BaseModel):
    eligible: bool
    eligible_le: dt.date | None
    raison: str | None = None
    delai_jours: int | None = None
    age: int | None = None
