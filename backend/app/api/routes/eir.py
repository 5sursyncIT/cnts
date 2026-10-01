import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_staff
from app.audit.events import log_event
from app.db.models import EIR, ActeTransfusionnel, UserAccount
from app.db.session import get_db
from app.schemas.eir import EIRCreate, EIROut, EIRUpdate

router = APIRouter(prefix="/eir")


@router.post("", response_model=EIROut, status_code=201)
def create_eir(
    payload: EIRCreate,
    db: Session = Depends(get_db),
    user: UserAccount = Depends(require_staff),
) -> EIR:
    acte = db.get(ActeTransfusionnel, payload.acte_transfusionnel_id)
    if acte is None:
        raise HTTPException(status_code=404, detail="acte transfusionnel introuvable")

    # La poche et le receveur sont ceux de l'acte : on refuse toute incohérence.
    if payload.poche_id is not None and payload.poche_id != acte.poche_id:
        raise HTTPException(status_code=422, detail="la poche ne correspond pas a l'acte transfusionnel")
    receveur_id = payload.receveur_id or acte.receveur_id
    if receveur_id is None:
        raise HTTPException(status_code=422, detail="receveur inconnu pour cet acte transfusionnel")
    if acte.receveur_id is not None and receveur_id != acte.receveur_id:
        raise HTTPException(status_code=422, detail="le receveur ne correspond pas a l'acte transfusionnel")

    eir = EIR(
        **payload.model_dump(exclude={"receveur_id", "poche_id", "date_declaration"}),
        receveur_id=receveur_id,
        poche_id=acte.poche_id,
        declarant_id=user.id,
        date_declaration=payload.date_declaration or dt.datetime.now(dt.timezone.utc),
    )
    db.add(eir)
    db.flush()

    log_event(
        db,
        aggregate_type="eir",
        aggregate_id=eir.id,
        event_type="eir.declare",
        payload={
            "acte_id": str(payload.acte_transfusionnel_id),
            "type_eir": payload.type_eir,
            "gravite": payload.gravite,
        },
    )
    db.commit()
    db.refresh(eir)
    return eir


@router.get("", response_model=list[EIROut])
def list_eir(
    receveur_id: uuid.UUID | None = Query(default=None),
    type_eir: str | None = Query(default=None),
    gravite: str | None = Query(default=None),
    statut_investigation: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[EIR]:
    stmt = select(EIR)
    if receveur_id:
        stmt = stmt.where(EIR.receveur_id == receveur_id)
    if type_eir:
        stmt = stmt.where(EIR.type_eir == type_eir)
    if gravite:
        stmt = stmt.where(EIR.gravite == gravite)
    if statut_investigation:
        stmt = stmt.where(EIR.statut_investigation == statut_investigation)
    return list(
        db.execute(stmt.order_by(EIR.created_at.desc()).offset(offset).limit(limit)).scalars()
    )


@router.get("/statistiques")
def statistiques_eir(db: Session = Depends(get_db)) -> dict:
    total = db.execute(select(func.count(EIR.id))).scalar() or 0
    by_type = dict(
        db.execute(select(EIR.type_eir, func.count(EIR.id)).group_by(EIR.type_eir)).all()
    )
    by_gravite = dict(
        db.execute(select(EIR.gravite, func.count(EIR.id)).group_by(EIR.gravite)).all()
    )
    ouvertes = (
        db.execute(
            select(func.count(EIR.id)).where(EIR.statut_investigation != "CLOTUREE")
        ).scalar()
        or 0
    )
    return {
        "total": total,
        "par_type": by_type,
        "par_gravite": by_gravite,
        "investigations_ouvertes": ouvertes,
    }


@router.get("/{eir_id}", response_model=EIROut)
def get_eir(eir_id: uuid.UUID, db: Session = Depends(get_db)) -> EIR:
    eir = db.get(EIR, eir_id)
    if eir is None:
        raise HTTPException(status_code=404, detail="eir introuvable")
    return eir


@router.patch("/{eir_id}", response_model=EIROut)
def update_eir(
    eir_id: uuid.UUID,
    payload: EIRUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount = Depends(require_staff),
) -> EIR:
    eir = db.get(EIR, eir_id)
    if eir is None:
        raise HTTPException(status_code=404, detail="eir introuvable")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(eir, field, value)

    log_event(
        db,
        aggregate_type="eir",
        aggregate_id=eir.id,
        event_type="eir.modifie",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(eir)
    return eir


@router.post("/{eir_id}/cloturer", response_model=EIROut)
def cloturer_eir(
    eir_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: UserAccount = Depends(require_staff),
) -> EIR:
    eir = db.get(EIR, eir_id)
    if eir is None:
        raise HTTPException(status_code=404, detail="eir introuvable")
    if eir.statut_investigation == "CLOTUREE":
        raise HTTPException(status_code=409, detail="investigation deja cloturee")

    eir.statut_investigation = "CLOTUREE"

    log_event(
        db,
        aggregate_type="eir",
        aggregate_id=eir.id,
        event_type="eir.cloture",
        payload={"conclusion": eir.conclusion},
    )
    db.commit()
    db.refresh(eir)
    return eir
