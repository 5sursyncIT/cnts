import uuid
from datetime import date, datetime

from pydantic import BaseModel


# ── Documents Qualite ─────────────────────────


class DocumentQualiteCreate(BaseModel):
    code: str
    titre: str
    type_document: str
    version: str = "1.0"
    fichier_url: str | None = None


class DocumentQualiteUpdate(BaseModel):
    titre: str | None = None
    version: str | None = None
    statut: str | None = None
    fichier_url: str | None = None
    date_revision: date | None = None


class DocumentQualiteOut(BaseModel):
    id: uuid.UUID
    code: str
    titre: str
    type_document: str
    version: str
    statut: str
    fichier_url: str | None = None
    redacteur_id: uuid.UUID | None = None
    verificateur_id: uuid.UUID | None = None
    approbateur_id: uuid.UUID | None = None
    date_approbation: date | None = None
    date_revision: date | None = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Non-Conformites ──────────────────────────


class NonConformiteCreate(BaseModel):
    code: str
    titre: str
    description: str | None = None
    type_nc: str
    gravite: str
    action_immediate: str | None = None


class NonConformiteUpdate(BaseModel):
    statut: str | None = None
    cause_racine: str | None = None
    action_corrective: str | None = None
    responsable_id: uuid.UUID | None = None


class NonConformiteOut(BaseModel):
    id: uuid.UUID
    code: str
    titre: str
    description: str | None = None
    type_nc: str
    gravite: str
    statut: str
    detecteur_id: uuid.UUID | None = None
    responsable_id: uuid.UUID | None = None
    cause_racine: str | None = None
    action_immediate: str | None = None
    action_corrective: str | None = None
    date_cloture: date | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── CAPA ─────────────────────────────────────


class CAPACreate(BaseModel):
    code: str
    non_conformite_id: uuid.UUID | None = None
    type_action: str
    description: str
    responsable_id: uuid.UUID | None = None
    date_echeance: date | None = None


class CAPAUpdate(BaseModel):
    statut: str | None = None
    verification: str | None = None
    efficacite: str | None = None


class CAPAOut(BaseModel):
    id: uuid.UUID
    code: str
    non_conformite_id: uuid.UUID | None = None
    type_action: str
    description: str
    responsable_id: uuid.UUID | None = None
    date_echeance: date | None = None
    statut: str
    verification: str | None = None
    efficacite: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Audits Internes ──────────────────────────


class AuditInterneCreate(BaseModel):
    code: str
    titre: str
    processus_audite: str | None = None
    date_audit: date | None = None


class AuditInterneUpdate(BaseModel):
    statut: str | None = None
    constats: dict | None = None
    conclusion: str | None = None


class AuditInterneOut(BaseModel):
    id: uuid.UUID
    code: str
    titre: str
    processus_audite: str | None = None
    date_audit: date | None = None
    auditeur_id: uuid.UUID | None = None
    statut: str
    constats: dict | None = None
    conclusion: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
