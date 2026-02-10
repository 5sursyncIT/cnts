import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import Don, Donneur, ProcedureApherese, UserAccount
from app.db.session import get_db
from app.schemas.apherese import (
    ProcedureAphereseCreate,
    ProcedureAphereseOut,
    ProcedureAphereseUpdate,
)

router = APIRouter(prefix="/apherese")


@router.post("", response_model=ProcedureAphereseOut, status_code=201)
def create_apherese(
    payload: ProcedureAphereseCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> ProcedureApherese:
    don = db.get(Don, payload.don_id)
    if don is None:
        raise HTTPException(status_code=404, detail="don introuvable")
    donneur = db.get(Donneur, payload.donneur_id)
    if donneur is None:
        raise HTTPException(status_code=404, detail="donneur introuvable")

    existing = db.execute(
        select(ProcedureApherese).where(ProcedureApherese.don_id == payload.don_id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=409, detail="une procedure d'apherese existe deja pour ce don"
        )

    procedure = ProcedureApherese(**payload.model_dump())
    db.add(procedure)
    db.flush()

    log_event(
        db,
        aggregate_type="apherese",
        aggregate_id=procedure.id,
        event_type="apherese.demarree",
        payload={
            "don_id": str(payload.don_id),
            "donneur_id": str(payload.donneur_id),
            "type_apherese": payload.type_apherese,
        },
    )
    db.commit()
    db.refresh(procedure)
    return procedure


@router.get("", response_model=list[ProcedureAphereseOut])
def list_aphereses(
    donneur_id: uuid.UUID | None = Query(default=None),
    type_apherese: str | None = Query(default=None),
    statut: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[ProcedureApherese]:
    stmt = select(ProcedureApherese)
    if donneur_id:
        stmt = stmt.where(ProcedureApherese.donneur_id == donneur_id)
    if type_apherese:
        stmt = stmt.where(ProcedureApherese.type_apherese == type_apherese)
    if statut:
        stmt = stmt.where(ProcedureApherese.statut == statut)
    return list(
        db.execute(
            stmt.order_by(ProcedureApherese.created_at.desc()).offset(offset).limit(limit)
        ).scalars()
    )


@router.get("/{apherese_id}", response_model=ProcedureAphereseOut)
def get_apherese(apherese_id: uuid.UUID, db: Session = Depends(get_db)) -> ProcedureApherese:
    procedure = db.get(ProcedureApherese, apherese_id)
    if procedure is None:
        raise HTTPException(status_code=404, detail="procedure apherese introuvable")
    return procedure


@router.patch("/{apherese_id}", response_model=ProcedureAphereseOut)
def update_apherese(
    apherese_id: uuid.UUID,
    payload: ProcedureAphereseUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> ProcedureApherese:
    procedure = db.get(ProcedureApherese, apherese_id)
    if procedure is None:
        raise HTTPException(status_code=404, detail="procedure apherese introuvable")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(procedure, field, value)

    log_event(
        db,
        aggregate_type="apherese",
        aggregate_id=procedure.id,
        event_type="apherese.modifiee",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(procedure)
    return procedure
