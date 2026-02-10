import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import Consommable, LotConsommable, MouvementConsommable, UserAccount
from app.db.session import get_db
from app.schemas.consommables import (
    ConsommableCreate,
    ConsommableOut,
    ConsommableUpdate,
    LotConsommableCreate,
    LotConsommableOut,
    MouvementConsommableCreate,
    MouvementConsommableOut,
)

router = APIRouter(prefix="/consommables")


# ── Consommables ─────────────────────────────


@router.post("", response_model=ConsommableOut, status_code=201)
def create_consommable(
    payload: ConsommableCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Consommable:
    existing = db.execute(
        select(Consommable).where(Consommable.code == payload.code)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="un consommable avec ce code existe deja")

    consommable = Consommable(**payload.model_dump())
    db.add(consommable)
    db.flush()
    log_event(
        db,
        aggregate_type="consommable",
        aggregate_id=consommable.id,
        event_type="consommable.cree",
        payload={"code": consommable.code},
    )
    db.commit()
    db.refresh(consommable)
    return consommable


@router.get("", response_model=list[ConsommableOut])
def list_consommables(
    categorie: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[Consommable]:
    stmt = select(Consommable)
    if categorie:
        stmt = stmt.where(Consommable.categorie == categorie)
    return list(
        db.execute(stmt.order_by(Consommable.designation).offset(offset).limit(limit)).scalars()
    )


@router.get("/{consommable_id}", response_model=ConsommableOut)
def get_consommable(consommable_id: uuid.UUID, db: Session = Depends(get_db)) -> Consommable:
    consommable = db.get(Consommable, consommable_id)
    if consommable is None:
        raise HTTPException(status_code=404, detail="consommable introuvable")
    return consommable


@router.patch("/{consommable_id}", response_model=ConsommableOut)
def update_consommable(
    consommable_id: uuid.UUID,
    payload: ConsommableUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Consommable:
    consommable = db.get(Consommable, consommable_id)
    if consommable is None:
        raise HTTPException(status_code=404, detail="consommable introuvable")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(consommable, field, value)
    log_event(
        db,
        aggregate_type="consommable",
        aggregate_id=consommable.id,
        event_type="consommable.modifie",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(consommable)
    return consommable


# ── Lots ─────────────────────────────────────


@router.post("/lots", response_model=LotConsommableOut, status_code=201)
def create_lot(
    payload: LotConsommableCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> LotConsommable:
    consommable = db.get(Consommable, payload.consommable_id)
    if consommable is None:
        raise HTTPException(status_code=404, detail="consommable introuvable")

    lot = LotConsommable(
        **payload.model_dump(),
        quantite_restante=payload.quantite_recue,
    )
    db.add(lot)
    db.flush()
    log_event(
        db,
        aggregate_type="lot_consommable",
        aggregate_id=lot.id,
        event_type="lot.receptionne",
        payload={"numero_lot": lot.numero_lot, "quantite": lot.quantite_recue},
    )
    db.commit()
    db.refresh(lot)
    return lot


@router.get("/lots", response_model=list[LotConsommableOut])
def list_lots(
    consommable_id: uuid.UUID | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[LotConsommable]:
    stmt = select(LotConsommable)
    if consommable_id:
        stmt = stmt.where(LotConsommable.consommable_id == consommable_id)
    return list(
        db.execute(
            stmt.order_by(LotConsommable.date_reception.desc()).offset(offset).limit(limit)
        ).scalars()
    )


# ── Mouvements ───────────────────────────────


@router.post("/mouvements", response_model=MouvementConsommableOut, status_code=201)
def create_mouvement(
    payload: MouvementConsommableCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> MouvementConsommable:
    lot = db.get(LotConsommable, payload.lot_id)
    if lot is None:
        raise HTTPException(status_code=404, detail="lot introuvable")

    if payload.type_mouvement == "SORTIE" and lot.quantite_restante < payload.quantite:
        raise HTTPException(status_code=409, detail="stock insuffisant pour ce lot")

    mouvement = MouvementConsommable(**payload.model_dump())
    db.add(mouvement)

    # Update lot stock
    if payload.type_mouvement == "ENTREE":
        lot.quantite_restante += payload.quantite
    elif payload.type_mouvement in ("SORTIE", "PERTE"):
        lot.quantite_restante -= payload.quantite
    elif payload.type_mouvement == "AJUSTEMENT":
        lot.quantite_restante = payload.quantite

    db.flush()
    log_event(
        db,
        aggregate_type="lot_consommable",
        aggregate_id=lot.id,
        event_type=f"mouvement.{payload.type_mouvement.lower()}",
        payload={"quantite": payload.quantite},
    )
    db.commit()
    db.refresh(mouvement)
    return mouvement


@router.get("/mouvements", response_model=list[MouvementConsommableOut])
def list_mouvements(
    lot_id: uuid.UUID | None = Query(default=None),
    type_mouvement: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[MouvementConsommable]:
    stmt = select(MouvementConsommable)
    if lot_id:
        stmt = stmt.where(MouvementConsommable.lot_id == lot_id)
    if type_mouvement:
        stmt = stmt.where(MouvementConsommable.type_mouvement == type_mouvement)
    return list(
        db.execute(
            stmt.order_by(MouvementConsommable.created_at.desc()).offset(offset).limit(limit)
        ).scalars()
    )
