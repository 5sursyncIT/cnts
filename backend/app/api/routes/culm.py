import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import CULM, Poche, Receveur, UserAccount
from app.db.session import get_db
from app.schemas.culm import CULMCreate, CULMOut

router = APIRouter(prefix="/culm")


@router.post("", response_model=CULMOut, status_code=201)
def create_culm(
    payload: CULMCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> CULM:
    poche = db.get(Poche, payload.poche_id)
    if poche is None:
        raise HTTPException(status_code=404, detail="poche introuvable")
    receveur = db.get(Receveur, payload.receveur_id)
    if receveur is None:
        raise HTTPException(status_code=404, detail="receveur introuvable")

    culm = CULM(**payload.model_dump())
    db.add(culm)
    db.flush()

    log_event(
        db,
        aggregate_type="culm",
        aggregate_id=culm.id,
        event_type="culm.realise",
        payload={
            "poche_id": str(payload.poche_id),
            "receveur_id": str(payload.receveur_id),
            "resultat": payload.resultat,
            "concordance_abo": payload.concordance_abo,
        },
    )
    db.commit()
    db.refresh(culm)
    return culm


@router.get("", response_model=list[CULMOut])
def list_culm(
    receveur_id: uuid.UUID | None = Query(default=None),
    poche_id: uuid.UUID | None = Query(default=None),
    resultat: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[CULM]:
    stmt = select(CULM)
    if receveur_id:
        stmt = stmt.where(CULM.receveur_id == receveur_id)
    if poche_id:
        stmt = stmt.where(CULM.poche_id == poche_id)
    if resultat:
        stmt = stmt.where(CULM.resultat == resultat)
    return list(
        db.execute(stmt.order_by(CULM.created_at.desc()).offset(offset).limit(limit)).scalars()
    )


@router.get("/{culm_id}", response_model=CULMOut)
def get_culm(culm_id: uuid.UUID, db: Session = Depends(get_db)) -> CULM:
    culm = db.get(CULM, culm_id)
    if culm is None:
        raise HTTPException(status_code=404, detail="culm introuvable")
    return culm
