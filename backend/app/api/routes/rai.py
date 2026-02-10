import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import RAI, Receveur, UserAccount
from app.db.session import get_db
from app.schemas.rai import RAICreate, RAIOut, RAIUpdate

router = APIRouter(prefix="/rai")


@router.post("", response_model=RAIOut, status_code=201)
def create_rai(
    payload: RAICreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> RAI:
    receveur = db.get(Receveur, payload.receveur_id)
    if receveur is None:
        raise HTTPException(status_code=404, detail="receveur introuvable")

    rai = RAI(**payload.model_dump())
    db.add(rai)
    db.flush()

    log_event(
        db,
        aggregate_type="rai",
        aggregate_id=rai.id,
        event_type="rai.creee",
        payload={"receveur_id": str(payload.receveur_id), "resultat": payload.resultat},
    )
    db.commit()
    db.refresh(rai)
    return rai


@router.get("", response_model=list[RAIOut])
def list_rai(
    receveur_id: uuid.UUID | None = Query(default=None),
    resultat: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[RAI]:
    stmt = select(RAI)
    if receveur_id:
        stmt = stmt.where(RAI.receveur_id == receveur_id)
    if resultat:
        stmt = stmt.where(RAI.resultat == resultat)
    return list(
        db.execute(stmt.order_by(RAI.created_at.desc()).offset(offset).limit(limit)).scalars()
    )


@router.get("/{rai_id}", response_model=RAIOut)
def get_rai(rai_id: uuid.UUID, db: Session = Depends(get_db)) -> RAI:
    rai = db.get(RAI, rai_id)
    if rai is None:
        raise HTTPException(status_code=404, detail="rai introuvable")
    return rai


@router.patch("/{rai_id}", response_model=RAIOut)
def update_rai(
    rai_id: uuid.UUID,
    payload: RAIUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> RAI:
    rai = db.get(RAI, rai_id)
    if rai is None:
        raise HTTPException(status_code=404, detail="rai introuvable")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(rai, field, value)

    log_event(
        db,
        aggregate_type="rai",
        aggregate_id=rai.id,
        event_type="rai.modifiee",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(rai)
    return rai


@router.get("/receveur/{receveur_id}/valide", response_model=RAIOut | None)
def get_rai_valide(receveur_id: uuid.UUID, db: Session = Depends(get_db)) -> RAI | None:
    now = dt.datetime.now(dt.timezone.utc)
    stmt = (
        select(RAI)
        .where(
            RAI.receveur_id == receveur_id,
            RAI.resultat != "EN_ATTENTE",
        )
        .order_by(RAI.date_prelevement.desc())
    )
    for rai in db.execute(stmt).scalars():
        expiry = rai.date_prelevement + dt.timedelta(hours=rai.validite_heures)
        if expiry > now:
            return rai
    return None
