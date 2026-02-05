import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import require_auth_in_production
from app.core.blood import normalize_groupe_sanguin
from app.db.models import Receveur, UserAccount
from app.db.session import get_db
from app.schemas.receveurs import ReceveurCreate, ReceveurOut, ReceveurUpdate

router = APIRouter(prefix="/receveurs")


@router.post("", response_model=ReceveurOut, status_code=201)
def create_receveur(
    payload: ReceveurCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Receveur:
    row = Receveur(
        nom=payload.nom,
        prenom=payload.prenom,
        sexe=payload.sexe,
        date_naissance=payload.date_naissance,
        adresse=payload.adresse,
        telephone=payload.telephone,
        hopital_id=payload.hopital_id,
        groupe_sanguin=normalize_groupe_sanguin(payload.groupe_sanguin)
        if payload.groupe_sanguin is not None
        else None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{receveur_id}", status_code=204)
def delete_receveur(
    receveur_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
):
    row = db.get(Receveur, receveur_id)
    if row is None:
        raise HTTPException(status_code=404, detail="receveur introuvable")
    
    db.delete(row)
    db.commit()


@router.get("", response_model=list[ReceveurOut])
def list_receveurs(
    groupe_sanguin: str | None = Query(default=None, max_length=8),
    limit: int = Query(default=200, le=500),
    db: Session = Depends(get_db),
) -> list[Receveur]:
    stmt = select(Receveur).options(joinedload(Receveur.hopital))
    if groupe_sanguin is not None:
        stmt = stmt.where(Receveur.groupe_sanguin == normalize_groupe_sanguin(groupe_sanguin))
    stmt = stmt.order_by(Receveur.created_at.desc()).limit(limit)
    return list(db.execute(stmt).scalars())


@router.get("/{receveur_id}", response_model=ReceveurOut)
def get_receveur(receveur_id: uuid.UUID, db: Session = Depends(get_db)) -> Receveur:
    stmt = select(Receveur).options(joinedload(Receveur.hopital)).where(Receveur.id == receveur_id)
    row = db.execute(stmt).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="receveur introuvable")
    return row


@router.put("/{receveur_id}", response_model=ReceveurOut)
def update_receveur(
    receveur_id: uuid.UUID,
    payload: ReceveurUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Receveur:
    row = db.get(Receveur, receveur_id)
    if row is None:
        raise HTTPException(status_code=404, detail="receveur introuvable")

    if payload.nom is not None:
        row.nom = payload.nom
    
    if payload.prenom is not None:
        row.prenom = payload.prenom
        
    if payload.sexe is not None:
        row.sexe = payload.sexe
        
    if payload.date_naissance is not None:
        row.date_naissance = payload.date_naissance
        
    if payload.adresse is not None:
        row.adresse = payload.adresse
        
    if payload.telephone is not None:
        row.telephone = payload.telephone
    
    if payload.hopital_id is not None:
        row.hopital_id = payload.hopital_id
    
    if payload.groupe_sanguin is not None:
        row.groupe_sanguin = normalize_groupe_sanguin(payload.groupe_sanguin)

    db.commit()
    db.refresh(row)
    return row
