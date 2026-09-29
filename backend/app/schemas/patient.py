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


# --- Dons (vue patient) ---
# Volontairement minimal : aucun statut de qualification ni résultat biologique n'est
# exposé au donneur en ligne (un don écarté pourrait trahir un résultat de sérologie).


class DonPatientResponse(BaseModel):
    id: UUID
    date_don: date
    type_don: str

    model_config = ConfigDict(from_attributes=True)


# --- Carte donneur (vue patient) ---


class PointsPatientResponse(BaseModel):
    type_operation: str
    points: int
    description: str | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CartePatientResponse(BaseModel):
    numero_carte: str
    niveau: str
    points: int
    total_dons: int
    date_premier_don: date | None = None
    date_dernier_don: date | None = None
    is_active: bool
    historique: list[PointsPatientResponse] = []


# --- Création de compte patient (liaison à un dossier donneur existant) ---


class PatientRegisterIn(BaseModel):
    cni: str
    date_naissance: date
    email: EmailStr
    password: str
