import datetime as dt
import uuid

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.core.blood import validate_analyse_resultat


class AnalyseCreate(BaseModel):
    """Créer une nouvelle analyse pour un don."""

    don_id: uuid.UUID
    type_test: str = Field(
        min_length=2,
        max_length=32,
        description="Type de test: ABO, RH, VIH, VHB, VHC, SYPHILIS",
    )
    resultat: str = Field(description="Résultat du test")
    note: str | None = Field(default=None, max_length=1000)
    validateur_id: uuid.UUID | None = Field(default=None)

    @model_validator(mode="after")
    def _validate_resultat(self) -> "AnalyseCreate":
        validate_analyse_resultat(type_test=self.type_test, resultat=self.resultat)
        return self


class AnalyseUpdate(BaseModel):
    """Mettre à jour le résultat d'une analyse existante."""

    resultat: str = Field(description="Résultat du test")
    note: str | None = Field(default=None, max_length=1000)
    validateur_id: uuid.UUID | None = Field(default=None)


class AnalyseOut(BaseModel):
    """Représentation d'une analyse."""

    id: uuid.UUID
    don_id: uuid.UUID
    type_test: str
    resultat: str
    note: str | None
    validateur_id: uuid.UUID | None
    created_at: dt.datetime

    model_config = ConfigDict(from_attributes=True)


class LiberationBiologiqueOut(BaseModel):
    """Résultat de la libération biologique d'un don."""

    don_id: uuid.UUID
    din: str
    statut_qualification: str
    liberable: bool
    raison: str | None = Field(
        default=None,
        description="Raison pour laquelle le don n'est pas libérable",
    )
    tests_manquants: list[str] = Field(default_factory=list)
    tests_positifs: list[str] = Field(default_factory=list)
    analyses: list[AnalyseOut]
