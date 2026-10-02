from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field

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
    # Coordonnées seulement : l'identité (nom, prénom, sexe, date de naissance) est
    # rectifiée au centre, sur présentation d'une pièce. Champs inconnus ignorés.
    adresse: str | None = Field(default=None, max_length=255)
    telephone: str | None = Field(default=None, max_length=32)
    email: EmailStr | None = Field(default=None, max_length=120)
    profession: str | None = Field(default=None, max_length=120)


class DonneurResponse(DonneurBase):
    id: UUID
    dernier_don: date | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# --- Rendez-Vous Schemas ---

TYPES_RDV = ("DON_SANG",)
STATUTS_RDV = ("CONFIRME", "ANNULE", "EFFECTUE", "MANQUE")


class RendezVousCreate(BaseModel):
    date_prevue: datetime
    lieu_id: UUID
    type_rdv: str = Field(default="DON_SANG", pattern="^(DON_SANG)$")
    commentaire: str | None = Field(default=None, max_length=1000)


class RendezVousResponse(BaseModel):
    id: UUID
    date_prevue: datetime
    type_rdv: str
    lieu: str | None = None
    lieu_id: UUID | None = None
    commentaire: str | None = None
    statut: str
    motif: str | None = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LieuRdvPublic(BaseModel):
    id: UUID
    nom: str
    adresse: str | None = None
    horaires: dict[str, list[list[str]]]
    duree_creneau_min: int
    delai_min_heures: int
    horizon_jours: int

    model_config = ConfigDict(from_attributes=True)


class CreneauOut(BaseModel):
    debut: datetime
    places: int


class EligibilitePatientOut(BaseModel):
    eligible: bool
    eligible_le: date | None = None
    raison: str


# --- Document Medical Schemas ---

TYPES_DOCUMENT = ("ATTESTATION", "CERTIFICAT", "COMPTE_RENDU", "AUTRE")


class DocumentMedicalResponse(BaseModel):
    id: UUID
    titre: str
    type_document: str
    description: str | None = None
    date_document: date
    # Lien de téléchargement relatif à l'API (vide si aucun fichier).
    fichier_url: str
    fichier_nom: str | None = None
    mime: str | None = None
    taille: int | None = None
    created_at: datetime


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
    cni: str = Field(max_length=64)
    date_naissance: date
    email: EmailStr
    password: str = Field(max_length=128)


class EmailTokenIn(BaseModel):
    token: str = Field(min_length=1, max_length=2048)


class PhoneCodeIn(BaseModel):
    challenge_token: str = Field(min_length=1, max_length=2048)
    code: str = Field(pattern=r"^\d{6}$")


class PhoneResendIn(BaseModel):
    challenge_token: str = Field(min_length=1, max_length=2048)


class EmailIn(BaseModel):
    email: EmailStr


class PasswordResetConfirmIn(BaseModel):
    token: str = Field(min_length=1, max_length=2048)
    password: str = Field(max_length=128)


class PasswordChangeIn(BaseModel):
    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(max_length=128)
