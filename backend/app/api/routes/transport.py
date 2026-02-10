import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import Livraison, ReleveTemperatureTransport, UserAccount
from app.db.session import get_db
from app.schemas.transport import (
    LivraisonCreate,
    LivraisonOut,
    LivraisonUpdate,
    ReleveTemperatureCreate,
    ReleveTemperatureOut,
)

router = APIRouter(prefix="/transport")


@router.post("/livraisons", response_model=LivraisonOut, status_code=201)
def create_livraison(
    payload: LivraisonCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Livraison:
    livraison = Livraison(**payload.model_dump())
    livraison.heure_depart = dt.datetime.now(dt.timezone.utc)
    db.add(livraison)
    db.flush()

    log_event(
        db,
        aggregate_type="livraison",
        aggregate_id=livraison.id,
        event_type="livraison.creee",
        payload={"statut": livraison.statut},
    )
    db.commit()
    db.refresh(livraison)
    return livraison


@router.get("/livraisons", response_model=list[LivraisonOut])
def list_livraisons(
    statut: str | None = Query(default=None),
    hopital_id: uuid.UUID | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[Livraison]:
    stmt = select(Livraison)
    if statut:
        stmt = stmt.where(Livraison.statut == statut)
    if hopital_id:
        stmt = stmt.where(Livraison.hopital_id == hopital_id)
    return list(
        db.execute(stmt.order_by(Livraison.created_at.desc()).offset(offset).limit(limit)).scalars()
    )


@router.get("/livraisons/{livraison_id}", response_model=LivraisonOut)
def get_livraison(livraison_id: uuid.UUID, db: Session = Depends(get_db)) -> Livraison:
    livraison = db.get(Livraison, livraison_id)
    if livraison is None:
        raise HTTPException(status_code=404, detail="livraison introuvable")
    return livraison


@router.patch("/livraisons/{livraison_id}", response_model=LivraisonOut)
def update_livraison(
    livraison_id: uuid.UUID,
    payload: LivraisonUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Livraison:
    livraison = db.get(Livraison, livraison_id)
    if livraison is None:
        raise HTTPException(status_code=404, detail="livraison introuvable")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(livraison, field, value)

    log_event(
        db,
        aggregate_type="livraison",
        aggregate_id=livraison.id,
        event_type="livraison.modifiee",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(livraison)
    return livraison


# ── Releves temperature ──────────────────────


@router.post("/releves-temperature", response_model=ReleveTemperatureOut, status_code=201)
def create_releve(
    payload: ReleveTemperatureCreate,
    db: Session = Depends(get_db),
) -> ReleveTemperatureTransport:
    livraison = db.get(Livraison, payload.livraison_id)
    if livraison is None:
        raise HTTPException(status_code=404, detail="livraison introuvable")

    releve = ReleveTemperatureTransport(**payload.model_dump())
    db.add(releve)
    db.commit()
    db.refresh(releve)
    return releve


@router.get("/livraisons/{livraison_id}/releves", response_model=list[ReleveTemperatureOut])
def list_releves(
    livraison_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> list[ReleveTemperatureTransport]:
    stmt = (
        select(ReleveTemperatureTransport)
        .where(ReleveTemperatureTransport.livraison_id == livraison_id)
        .order_by(ReleveTemperatureTransport.recorded_at)
    )
    return list(db.execute(stmt).scalars())
