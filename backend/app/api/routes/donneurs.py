import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, or_
from sqlalchemy.orm import Session

from app.core.dates import add_months
from app.core.security import hash_cni
from app.db.models import Donneur
from app.db.session import get_db
from app.schemas.donneurs import DonneurCreate, DonneurOut, DonneurUpdate, EligibiliteOut

router = APIRouter(prefix="/donneurs")


@router.post("", response_model=DonneurOut)
def create_donneur(payload: DonneurCreate, db: Session = Depends(get_db)) -> Donneur:
    cni_hash = hash_cni(payload.cni)
    existing = db.execute(select(Donneur).where(Donneur.cni_hash == cni_hash)).scalar_one_or_none()
    if existing is not None:
        return existing
    row = Donneur(
        cni_hash=cni_hash,
        cni=payload.cni,  # Store clear CNI
        nom=payload.nom,
        prenom=payload.prenom,
        sexe=payload.sexe,
        date_naissance=payload.date_naissance,
        groupe_sanguin=payload.groupe_sanguin,
        adresse=payload.adresse,
        region=payload.region,
        departement=payload.departement,
        telephone=payload.telephone,
        email=payload.email,
        profession=payload.profession,
        dernier_don=None,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("", response_model=list[DonneurOut])
def list_donneurs(
    q: str | None = Query(default=None),
    sexe: str | None = Query(default=None),
    groupe_sanguin: str | None = Query(default=None),
    region: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
    db: Session = Depends(get_db)
) -> list[Donneur]:
    stmt = select(Donneur)
    
    if q:
        search_filter = or_(
            Donneur.nom.ilike(f"%{q}%"),
            Donneur.prenom.ilike(f"%{q}%"),
            Donneur.cni.ilike(f"%{q}%")
        )
        stmt = stmt.where(search_filter)

    if sexe:
        stmt = stmt.where(Donneur.sexe == sexe)

    if groupe_sanguin:
        stmt = stmt.where(Donneur.groupe_sanguin == groupe_sanguin)

    if region:
        stmt = stmt.where(Donneur.region == region)

    return list(db.execute(stmt.order_by(Donneur.created_at.desc()).offset(offset).limit(limit)).scalars())


@router.get("/{donneur_id}", response_model=DonneurOut)
def get_donneur(donneur_id: str, db: Session = Depends(get_db)) -> Donneur:
    row = db.get(Donneur, donneur_id)
    if row is None:
        raise HTTPException(status_code=404, detail="donneur not found")
    return row


@router.put("/{donneur_id}", response_model=DonneurOut)
def update_donneur(
    donneur_id: str,
    payload: DonneurUpdate,
    db: Session = Depends(get_db),
) -> Donneur:
    row = db.get(Donneur, donneur_id)
    if row is None:
        raise HTTPException(status_code=404, detail="donneur not found")

    if payload.cni is not None:
        row.cni = payload.cni
        row.cni_hash = hash_cni(payload.cni)
    
    if payload.nom is not None:
        row.nom = payload.nom
    if payload.prenom is not None:
        row.prenom = payload.prenom
    if payload.sexe is not None:
        row.sexe = payload.sexe
    if payload.date_naissance is not None:
        row.date_naissance = payload.date_naissance
    if payload.groupe_sanguin is not None:
        row.groupe_sanguin = payload.groupe_sanguin
    if payload.adresse is not None:
        row.adresse = payload.adresse
    if payload.telephone is not None:
        row.telephone = payload.telephone
    if payload.email is not None:
        row.email = payload.email
    if payload.region is not None:
        row.region = payload.region
    if payload.departement is not None:
        row.departement = payload.departement
    if payload.profession is not None:
        row.profession = payload.profession

    db.commit()
    db.refresh(row)
    return row


@router.get("/{donneur_id}/eligibilite", response_model=EligibiliteOut)
def eligibilite(
    donneur_id: str,
    as_of: dt.date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> EligibiliteOut:
    row = db.get(Donneur, donneur_id)
    if row is None:
        raise HTTPException(status_code=404, detail="donneur not found")
    ref_date = as_of or dt.date.today()
    if row.dernier_don is None:
        return EligibiliteOut(eligible=True, eligible_le=None)
    months = 2 if row.sexe == "H" else 4
    eligible_le = add_months(row.dernier_don, months)
    return EligibiliteOut(eligible=ref_date >= eligible_le, eligible_le=eligible_le)


@router.delete("/{donneur_id}", status_code=204)
def delete_donneur(donneur_id: str, db: Session = Depends(get_db)) -> None:
    row = db.get(Donneur, donneur_id)
    if row is None:
        raise HTTPException(status_code=404, detail="donneur not found")
    db.delete(row)
    db.commit()
