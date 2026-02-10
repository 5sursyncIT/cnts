import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import ActeTransfusionnel, SuiviPerTransfusionnel, UserAccount
from app.db.session import get_db
from app.schemas.suivi_transfusion import SuiviPerTransfusionnelCreate, SuiviPerTransfusionnelOut

router = APIRouter(prefix="/suivi-transfusion")


@router.post("", response_model=SuiviPerTransfusionnelOut, status_code=201)
def create_suivi(
    payload: SuiviPerTransfusionnelCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> SuiviPerTransfusionnel:
    acte = db.get(ActeTransfusionnel, payload.acte_transfusionnel_id)
    if acte is None:
        raise HTTPException(status_code=404, detail="acte transfusionnel introuvable")

    suivi = SuiviPerTransfusionnel(**payload.model_dump())
    db.add(suivi)
    db.flush()

    log_event(
        db,
        aggregate_type="suivi_per_transfusionnel",
        aggregate_id=suivi.id,
        event_type="suivi.enregistre",
        payload={
            "acte_id": str(payload.acte_transfusionnel_id),
            "moment": payload.moment,
            "alerte": payload.alerte,
        },
    )
    db.commit()
    db.refresh(suivi)
    return suivi


@router.get("", response_model=list[SuiviPerTransfusionnelOut])
def list_suivis(
    acte_transfusionnel_id: uuid.UUID | None = Query(default=None),
    alerte: bool | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[SuiviPerTransfusionnel]:
    stmt = select(SuiviPerTransfusionnel)
    if acte_transfusionnel_id:
        stmt = stmt.where(SuiviPerTransfusionnel.acte_transfusionnel_id == acte_transfusionnel_id)
    if alerte is not None:
        stmt = stmt.where(SuiviPerTransfusionnel.alerte == alerte)
    return list(
        db.execute(
            stmt.order_by(SuiviPerTransfusionnel.created_at.desc()).offset(offset).limit(limit)
        ).scalars()
    )


@router.get("/{suivi_id}", response_model=SuiviPerTransfusionnelOut)
def get_suivi(suivi_id: uuid.UUID, db: Session = Depends(get_db)) -> SuiviPerTransfusionnel:
    suivi = db.get(SuiviPerTransfusionnel, suivi_id)
    if suivi is None:
        raise HTTPException(status_code=404, detail="suivi introuvable")
    return suivi
