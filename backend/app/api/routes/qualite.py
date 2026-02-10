import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import CAPA, AuditInterne, DocumentQualite, NonConformite, UserAccount
from app.db.session import get_db
from app.schemas.qualite import (
    AuditInterneCreate,
    AuditInterneOut,
    AuditInterneUpdate,
    CAPACreate,
    CAPAOut,
    CAPAUpdate,
    DocumentQualiteCreate,
    DocumentQualiteOut,
    DocumentQualiteUpdate,
    NonConformiteCreate,
    NonConformiteOut,
    NonConformiteUpdate,
)

router = APIRouter()


# ── Documents Qualite ─────────────────────────


@router.post("/documents", response_model=DocumentQualiteOut, status_code=201)
def create_document(
    payload: DocumentQualiteCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> DocumentQualite:
    existing = db.execute(
        select(DocumentQualite).where(DocumentQualite.code == payload.code)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="un document avec ce code existe deja")

    doc = DocumentQualite(**payload.model_dump())
    db.add(doc)
    db.flush()
    log_event(
        db,
        aggregate_type="document_qualite",
        aggregate_id=doc.id,
        event_type="document.cree",
        payload={"code": doc.code},
    )
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/documents", response_model=list[DocumentQualiteOut])
def list_documents(
    type_document: str | None = Query(default=None),
    statut: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[DocumentQualite]:
    stmt = select(DocumentQualite)
    if type_document:
        stmt = stmt.where(DocumentQualite.type_document == type_document)
    if statut:
        stmt = stmt.where(DocumentQualite.statut == statut)
    return list(
        db.execute(stmt.order_by(DocumentQualite.code).offset(offset).limit(limit)).scalars()
    )


@router.get("/documents/{doc_id}", response_model=DocumentQualiteOut)
def get_document(doc_id: uuid.UUID, db: Session = Depends(get_db)) -> DocumentQualite:
    doc = db.get(DocumentQualite, doc_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="document introuvable")
    return doc


@router.patch("/documents/{doc_id}", response_model=DocumentQualiteOut)
def update_document(
    doc_id: uuid.UUID,
    payload: DocumentQualiteUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> DocumentQualite:
    doc = db.get(DocumentQualite, doc_id)
    if doc is None:
        raise HTTPException(status_code=404, detail="document introuvable")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(doc, field, value)
    log_event(
        db,
        aggregate_type="document_qualite",
        aggregate_id=doc.id,
        event_type="document.modifie",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(doc)
    return doc


# ── Non-Conformites ──────────────────────────


@router.post("/non-conformites", response_model=NonConformiteOut, status_code=201)
def create_nc(
    payload: NonConformiteCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> NonConformite:
    existing = db.execute(
        select(NonConformite).where(NonConformite.code == payload.code)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="une NC avec ce code existe deja")

    nc = NonConformite(**payload.model_dump())
    db.add(nc)
    db.flush()
    log_event(
        db,
        aggregate_type="non_conformite",
        aggregate_id=nc.id,
        event_type="nc.ouverte",
        payload={"code": nc.code, "gravite": nc.gravite},
    )
    db.commit()
    db.refresh(nc)
    return nc


@router.get("/non-conformites", response_model=list[NonConformiteOut])
def list_nc(
    statut: str | None = Query(default=None),
    gravite: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[NonConformite]:
    stmt = select(NonConformite)
    if statut:
        stmt = stmt.where(NonConformite.statut == statut)
    if gravite:
        stmt = stmt.where(NonConformite.gravite == gravite)
    return list(
        db.execute(
            stmt.order_by(NonConformite.created_at.desc()).offset(offset).limit(limit)
        ).scalars()
    )


@router.get("/non-conformites/{nc_id}", response_model=NonConformiteOut)
def get_nc(nc_id: uuid.UUID, db: Session = Depends(get_db)) -> NonConformite:
    nc = db.get(NonConformite, nc_id)
    if nc is None:
        raise HTTPException(status_code=404, detail="non-conformite introuvable")
    return nc


@router.patch("/non-conformites/{nc_id}", response_model=NonConformiteOut)
def update_nc(
    nc_id: uuid.UUID,
    payload: NonConformiteUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> NonConformite:
    nc = db.get(NonConformite, nc_id)
    if nc is None:
        raise HTTPException(status_code=404, detail="non-conformite introuvable")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(nc, field, value)
    log_event(
        db,
        aggregate_type="non_conformite",
        aggregate_id=nc.id,
        event_type="nc.modifiee",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(nc)
    return nc


# ── CAPA ─────────────────────────────────────


@router.post("/capa", response_model=CAPAOut, status_code=201)
def create_capa(
    payload: CAPACreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> CAPA:
    existing = db.execute(select(CAPA).where(CAPA.code == payload.code)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="une CAPA avec ce code existe deja")

    capa = CAPA(**payload.model_dump())
    db.add(capa)
    db.flush()
    log_event(
        db,
        aggregate_type="capa",
        aggregate_id=capa.id,
        event_type="capa.creee",
        payload={"code": capa.code, "type": capa.type_action},
    )
    db.commit()
    db.refresh(capa)
    return capa


@router.get("/capa", response_model=list[CAPAOut])
def list_capa(
    statut: str | None = Query(default=None),
    type_action: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[CAPA]:
    stmt = select(CAPA)
    if statut:
        stmt = stmt.where(CAPA.statut == statut)
    if type_action:
        stmt = stmt.where(CAPA.type_action == type_action)
    return list(
        db.execute(stmt.order_by(CAPA.created_at.desc()).offset(offset).limit(limit)).scalars()
    )


@router.get("/capa/{capa_id}", response_model=CAPAOut)
def get_capa(capa_id: uuid.UUID, db: Session = Depends(get_db)) -> CAPA:
    capa = db.get(CAPA, capa_id)
    if capa is None:
        raise HTTPException(status_code=404, detail="capa introuvable")
    return capa


@router.patch("/capa/{capa_id}", response_model=CAPAOut)
def update_capa(
    capa_id: uuid.UUID,
    payload: CAPAUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> CAPA:
    capa = db.get(CAPA, capa_id)
    if capa is None:
        raise HTTPException(status_code=404, detail="capa introuvable")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(capa, field, value)
    log_event(
        db,
        aggregate_type="capa",
        aggregate_id=capa.id,
        event_type="capa.modifiee",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(capa)
    return capa


# ── Audits Internes ──────────────────────────


@router.post("/audits", response_model=AuditInterneOut, status_code=201)
def create_audit(
    payload: AuditInterneCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> AuditInterne:
    existing = db.execute(
        select(AuditInterne).where(AuditInterne.code == payload.code)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="un audit avec ce code existe deja")

    audit = AuditInterne(**payload.model_dump())
    db.add(audit)
    db.flush()
    log_event(
        db,
        aggregate_type="audit_interne",
        aggregate_id=audit.id,
        event_type="audit.planifie",
        payload={"code": audit.code},
    )
    db.commit()
    db.refresh(audit)
    return audit


@router.get("/audits", response_model=list[AuditInterneOut])
def list_audits(
    statut: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[AuditInterne]:
    stmt = select(AuditInterne)
    if statut:
        stmt = stmt.where(AuditInterne.statut == statut)
    return list(
        db.execute(
            stmt.order_by(AuditInterne.created_at.desc()).offset(offset).limit(limit)
        ).scalars()
    )


@router.get("/audits/{audit_id}", response_model=AuditInterneOut)
def get_audit(audit_id: uuid.UUID, db: Session = Depends(get_db)) -> AuditInterne:
    audit = db.get(AuditInterne, audit_id)
    if audit is None:
        raise HTTPException(status_code=404, detail="audit introuvable")
    return audit


@router.patch("/audits/{audit_id}", response_model=AuditInterneOut)
def update_audit(
    audit_id: uuid.UUID,
    payload: AuditInterneUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> AuditInterne:
    audit = db.get(AuditInterne, audit_id)
    if audit is None:
        raise HTTPException(status_code=404, detail="audit introuvable")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(audit, field, value)
    log_event(
        db,
        aggregate_type="audit_interne",
        aggregate_id=audit.id,
        event_type="audit.modifie",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(audit)
    return audit
