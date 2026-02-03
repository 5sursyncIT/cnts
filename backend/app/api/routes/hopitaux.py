import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Hopital
from app.db.session import get_db
from app.schemas.hopitaux import HopitalCreate, HopitalOut

router = APIRouter(prefix="/hopitaux")


@router.post("", response_model=HopitalOut, status_code=201)
def create_hopital(payload: HopitalCreate, db: Session = Depends(get_db)) -> Hopital:
    existing = db.execute(select(Hopital).where(Hopital.nom == payload.nom)).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(status_code=409, detail="hôpital déjà existant")

    row = Hopital(
        nom=payload.nom,
        adresse=payload.adresse,
        contact=payload.contact,
        convention_actif=payload.convention_actif,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("", response_model=list[HopitalOut])
def list_hopitaux(
    convention_actif: bool | None = Query(default=None),
    limit: int = Query(default=200, le=500),
    db: Session = Depends(get_db),
) -> list[Hopital]:
    stmt = select(Hopital)
    if convention_actif is not None:
        stmt = stmt.where(Hopital.convention_actif.is_(convention_actif))
    stmt = stmt.order_by(Hopital.nom.asc()).limit(limit)
    return list(db.execute(stmt).scalars())


@router.get("/{hopital_id}", response_model=HopitalOut)
def get_hopital(hopital_id: uuid.UUID, db: Session = Depends(get_db)) -> Hopital:
    row = db.get(Hopital, hopital_id)
    if row is None:
        raise HTTPException(status_code=404, detail="hôpital introuvable")
    return row
