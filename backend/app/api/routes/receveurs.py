import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.blood import normalize_groupe_sanguin
from app.db.models import Receveur
from app.db.session import get_db
from app.schemas.receveurs import ReceveurCreate, ReceveurOut

router = APIRouter(prefix="/receveurs")


@router.post("", response_model=ReceveurOut, status_code=201)
def create_receveur(payload: ReceveurCreate, db: Session = Depends(get_db)) -> Receveur:
    row = Receveur(
        nom=payload.nom,
        groupe_sanguin=normalize_groupe_sanguin(payload.groupe_sanguin)
        if payload.groupe_sanguin is not None
        else None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("", response_model=list[ReceveurOut])
def list_receveurs(
    groupe_sanguin: str | None = Query(default=None, max_length=8),
    limit: int = Query(default=200, le=500),
    db: Session = Depends(get_db),
) -> list[Receveur]:
    stmt = select(Receveur)
    if groupe_sanguin is not None:
        stmt = stmt.where(Receveur.groupe_sanguin == normalize_groupe_sanguin(groupe_sanguin))
    stmt = stmt.order_by(Receveur.created_at.desc()).limit(limit)
    return list(db.execute(stmt).scalars())


@router.get("/{receveur_id}", response_model=ReceveurOut)
def get_receveur(receveur_id: uuid.UUID, db: Session = Depends(get_db)) -> Receveur:
    row = db.get(Receveur, receveur_id)
    if row is None:
        raise HTTPException(status_code=404, detail="receveur introuvable")
    return row
