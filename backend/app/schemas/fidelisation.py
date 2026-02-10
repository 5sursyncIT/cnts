import uuid
from datetime import date, datetime

from pydantic import BaseModel


class CarteDonneurCreate(BaseModel):
    donneur_id: uuid.UUID
    numero_carte: str


class CarteDonneurOut(BaseModel):
    id: uuid.UUID
    donneur_id: uuid.UUID
    numero_carte: str
    qr_code_data: str | None = None
    niveau: str
    points: int
    total_dons: int
    date_premier_don: date | None = None
    date_dernier_don: date | None = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PointsHistoriqueOut(BaseModel):
    id: uuid.UUID
    carte_id: uuid.UUID
    type_operation: str
    points: int
    description: str | None = None
    reference_id: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class PointsAjoutCreate(BaseModel):
    carte_id: uuid.UUID
    type_operation: str
    points: int
    description: str | None = None
    reference_id: uuid.UUID | None = None


class CampagneRecrutementCreate(BaseModel):
    nom: str
    description: str | None = None
    date_debut: date
    date_fin: date | None = None
    cible: str | None = None
    canal: str
    message_template: str | None = None


class CampagneRecrutementUpdate(BaseModel):
    statut: str | None = None
    nb_contactes: int | None = None
    nb_convertis: int | None = None


class CampagneRecrutementOut(BaseModel):
    id: uuid.UUID
    nom: str
    description: str | None = None
    date_debut: date
    date_fin: date | None = None
    cible: str | None = None
    canal: str
    message_template: str | None = None
    statut: str
    nb_contactes: int
    nb_convertis: int
    created_at: datetime

    model_config = {"from_attributes": True}
