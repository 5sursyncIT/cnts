import datetime as dt
import re
import uuid

from pydantic import BaseModel, ConfigDict, Field, field_validator

HEURE = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


class DonneurRdvOut(BaseModel):
    id: uuid.UUID
    nom: str
    prenom: str
    telephone: str | None = None
    groupe_sanguin: str | None = None

    model_config = ConfigDict(from_attributes=True)


class RendezVousStaffOut(BaseModel):
    id: uuid.UUID
    date_prevue: dt.datetime
    type_rdv: str
    statut: str
    lieu: str | None = None
    lieu_id: uuid.UUID | None = None
    commentaire: str | None = None
    motif: str | None = None
    traite_le: dt.datetime | None = None
    created_at: dt.datetime
    donneur: DonneurRdvOut

    model_config = ConfigDict(from_attributes=True)


class RendezVousStatutIn(BaseModel):
    statut: str = Field(pattern="^(EFFECTUE|MANQUE|ANNULE)$")
    motif: str | None = Field(default=None, max_length=255)


class LieuRdvIn(BaseModel):
    code: str = Field(min_length=2, max_length=16, pattern=r"^[A-Z0-9_-]+$")
    nom: str = Field(min_length=2, max_length=120)
    adresse: str | None = Field(default=None, max_length=500)
    actif: bool = True
    horaires: dict[str, list[list[str]]] = Field(default_factory=dict)
    fermetures: list[dt.date] = Field(default_factory=list)
    duree_creneau_min: int = Field(default=30, ge=10, le=240)
    capacite_creneau: int = Field(default=3, ge=1, le=100)
    delai_min_heures: int = Field(default=2, ge=0, le=168)
    horizon_jours: int = Field(default=90, ge=1, le=365)

    @field_validator("horaires")
    @classmethod
    def _horaires(cls, v: dict[str, list[list[str]]]) -> dict[str, list[list[str]]]:
        for jour, plages in v.items():
            if jour not in {"1", "2", "3", "4", "5", "6", "7"}:
                raise ValueError("Jour invalide (1 = lundi … 7 = dimanche)")
            for plage in plages:
                if len(plage) != 2 or not all(HEURE.match(h) for h in plage) or plage[0] >= plage[1]:
                    raise ValueError(f"Plage horaire invalide : {plage} (format HH:MM, début < fin)")
        return v


class LieuRdvOut(BaseModel):
    id: uuid.UUID
    code: str
    nom: str
    adresse: str | None = None
    actif: bool
    horaires: dict[str, list[list[str]]]
    fermetures: list[str]
    duree_creneau_min: int
    capacite_creneau: int
    delai_min_heures: int
    horizon_jours: int

    model_config = ConfigDict(from_attributes=True)


class DocumentStaffOut(BaseModel):
    id: uuid.UUID
    titre: str
    type_document: str
    description: str | None = None
    date_document: dt.date
    fichier_nom: str | None = None
    mime: str | None = None
    taille: int | None = None
    created_at: dt.datetime

    model_config = ConfigDict(from_attributes=True)
