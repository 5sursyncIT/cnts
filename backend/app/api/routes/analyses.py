import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.core.blood import validate_analyse_resultat
from app.db.models import Analyse, Don, UserAccount
from app.db.session import get_db
from app.schemas.analyses import AnalyseCreate, AnalyseOut, AnalyseUpdate

router = APIRouter(prefix="/analyses")


@router.post("", response_model=AnalyseOut, status_code=201)
def create_analyse(
    payload: AnalyseCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Analyse:
    """
    Créer une nouvelle analyse pour un don.

    Types de tests recommandés:
    - ABO: Groupage ABO
    - RH: Groupage Rhésus
    - VIH: Test VIH
    - VHB: Test Hépatite B
    - VHC: Test Hépatite C
    - SYPHILIS: Test Syphilis
    """
    # Vérifier que le don existe
    don = db.get(Don, payload.don_id)
    if don is None:
        raise HTTPException(status_code=404, detail="don not found")

    # Vérifier si une analyse du même type existe déjà pour ce don
    existing = db.execute(
        select(Analyse).where(
            Analyse.don_id == payload.don_id, Analyse.type_test == payload.type_test
        )
    ).scalar_one_or_none()

    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail=f"Une analyse de type {payload.type_test} existe déjà pour ce don",
        )

    analyse = Analyse(
        don_id=payload.don_id,
        type_test=payload.type_test.strip().upper(),
        resultat=payload.resultat.strip().upper(),
        note=payload.note,
        validateur_id=payload.validateur_id,
    )
    db.add(analyse)
    db.commit()
    db.refresh(analyse)
    return analyse


@router.get("", response_model=list[AnalyseOut])
def list_analyses(
    don_id: uuid.UUID | None = Query(default=None),
    type_test: str | None = Query(default=None),
    resultat: str | None = Query(default=None),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[Analyse]:
    """
    Lister les analyses avec filtres optionnels.

    Supporte la pagination avec limit/offset.
    """
    stmt = select(Analyse)

    if don_id is not None:
        stmt = stmt.where(Analyse.don_id == don_id)
    if type_test is not None:
        stmt = stmt.where(Analyse.type_test == type_test)
    if resultat is not None:
        stmt = stmt.where(Analyse.resultat == resultat)

    stmt = stmt.order_by(Analyse.created_at.desc()).limit(limit).offset(offset)
    return list(db.execute(stmt).scalars())


@router.get("/{analyse_id}", response_model=AnalyseOut)
def get_analyse(analyse_id: uuid.UUID, db: Session = Depends(get_db)) -> Analyse:
    """Récupérer une analyse par son ID."""
    analyse = db.get(Analyse, analyse_id)
    if analyse is None:
        raise HTTPException(status_code=404, detail="analyse not found")
    return analyse


@router.patch("/{analyse_id}", response_model=AnalyseOut)
def update_analyse(
    analyse_id: uuid.UUID,
    payload: AnalyseUpdate,
    db: Session = Depends(get_db),
) -> Analyse:
    """
    Mettre à jour le résultat d'une analyse.

    Permet de modifier le résultat, la note et le validateur.
    """
    analyse = db.get(Analyse, analyse_id)
    if analyse is None:
        raise HTTPException(status_code=404, detail="analyse not found")

    validate_analyse_resultat(type_test=analyse.type_test, resultat=payload.resultat)
    analyse.resultat = payload.resultat.strip().upper()
    if payload.note is not None:
        analyse.note = payload.note
    if payload.validateur_id is not None:
        analyse.validateur_id = payload.validateur_id

    db.commit()
    db.refresh(analyse)
    return analyse


@router.delete("/{analyse_id}", status_code=204)
def delete_analyse(analyse_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    """Supprimer une analyse (à utiliser avec précaution)."""
    analyse = db.get(Analyse, analyse_id)
    if analyse is None:
        raise HTTPException(status_code=404, detail="analyse not found")

    db.delete(analyse)
    db.commit()
