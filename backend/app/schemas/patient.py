from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr


# --- Patient / Donneur Schemas ---

class DonneurBase(BaseModel):
    nom: str
    prenom: str
    sexe: str
    date_naissance: date | None = None
    groupe_sanguin: str | None = None
    adresse: str | None = None
    telephone: str | None = None
    email: EmailStr | None = None
    profession: str | None = None


class DonneurCreate(DonneurBase):
    cni: str  # Required for registration


class DonneurUpdate(BaseModel):
    nom: str | None = None
    prenom: str | None = None
    adresse: str | None = None
    telephone: str | None = None
    email: EmailStr | None = None
    profession: str | None = None


class DonneurResponse(DonneurBase):
    id: UUID
    dernier_don: date | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Rendez-Vous Schemas ---

class RendezVousBase(BaseModel):
    date_prevue: datetime
    type_rdv: str = "DON_SANG"
    lieu: str | None = None
    commentaire: str | None = None


class RendezVousCreate(RendezVousBase):
    pass


class RendezVousUpdate(BaseModel):
    date_prevue: datetime | None = None
    type_rdv: str | None = None
    lieu: str | None = None
    commentaire: str | None = None
    statut: str | None = None


class RendezVousResponse(RendezVousBase):
    id: UUID
    statut: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Document Medical Schemas ---

class DocumentMedicalBase(BaseModel):
    titre: str
    type_document: str
    description: str | None = None
    date_document: date


class DocumentMedicalCreate(DocumentMedicalBase):
    fichier_url: str


class DocumentMedicalResponse(DocumentMedicalBase):
    id: UUID
    fichier_url: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
