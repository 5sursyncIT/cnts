import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import (
    CampagneRecrutement,
    CarteDonneur,
    Donneur,
    PointsHistorique,
    UserAccount,
)
from app.db.session import get_db
from app.schemas.fidelisation import (
    CampagneRecrutementCreate,
    CampagneRecrutementOut,
    CampagneRecrutementUpdate,
    CarteDonneurCreate,
    CarteDonneurOut,
    PointsAjoutCreate,
    PointsHistoriqueOut,
)

router = APIRouter(prefix="/fidelisation")


# ── Cartes Donneur ───────────────────────────


@router.post("/cartes", response_model=CarteDonneurOut, status_code=201)
def create_carte(
    payload: CarteDonneurCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> CarteDonneur:
    donneur = db.get(Donneur, payload.donneur_id)
    if donneur is None:
        raise HTTPException(status_code=404, detail="donneur introuvable")

    existing = db.execute(
        select(CarteDonneur).where(CarteDonneur.donneur_id == payload.donneur_id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="ce donneur a deja une carte")

    carte = CarteDonneur(
        donneur_id=payload.donneur_id,
        numero_carte=payload.numero_carte,
        qr_code_data=f"CNTS:{payload.numero_carte}",
    )
    db.add(carte)
    db.flush()
    log_event(
        db,
        aggregate_type="carte_donneur",
        aggregate_id=carte.id,
        event_type="carte.creee",
        payload={"donneur_id": str(payload.donneur_id)},
    )
    db.commit()
    db.refresh(carte)
    return carte


@router.get("/cartes", response_model=list[CarteDonneurOut])
def list_cartes(
    niveau: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[CarteDonneur]:
    stmt = select(CarteDonneur)
    if niveau:
        stmt = stmt.where(CarteDonneur.niveau == niveau)
    if is_active is not None:
        stmt = stmt.where(CarteDonneur.is_active == is_active)
    return list(
        db.execute(
            stmt.order_by(CarteDonneur.created_at.desc()).offset(offset).limit(limit)
        ).scalars()
    )


@router.get("/cartes/{carte_id}", response_model=CarteDonneurOut)
def get_carte(carte_id: uuid.UUID, db: Session = Depends(get_db)) -> CarteDonneur:
    carte = db.get(CarteDonneur, carte_id)
    if carte is None:
        raise HTTPException(status_code=404, detail="carte introuvable")
    return carte


@router.get("/cartes/donneur/{donneur_id}", response_model=CarteDonneurOut)
def get_carte_by_donneur(donneur_id: uuid.UUID, db: Session = Depends(get_db)) -> CarteDonneur:
    carte = db.execute(
        select(CarteDonneur).where(CarteDonneur.donneur_id == donneur_id)
    ).scalar_one_or_none()
    if carte is None:
        raise HTTPException(status_code=404, detail="carte introuvable pour ce donneur")
    return carte


# ── Points ───────────────────────────────────


@router.post("/points", response_model=PointsHistoriqueOut, status_code=201)
def ajouter_points(
    payload: PointsAjoutCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> PointsHistorique:
    carte = db.get(CarteDonneur, payload.carte_id)
    if carte is None:
        raise HTTPException(status_code=404, detail="carte introuvable")

    entry = PointsHistorique(**payload.model_dump())
    db.add(entry)

    carte.points += payload.points

    # Update level based on total points
    if carte.points >= 1000:
        carte.niveau = "PLATINE"
    elif carte.points >= 500:
        carte.niveau = "OR"
    elif carte.points >= 200:
        carte.niveau = "ARGENT"

    db.flush()
    log_event(
        db,
        aggregate_type="carte_donneur",
        aggregate_id=carte.id,
        event_type="points.ajoutes",
        payload={"points": payload.points, "type": payload.type_operation},
    )
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/points/{carte_id}", response_model=list[PointsHistoriqueOut])
def historique_points(
    carte_id: uuid.UUID,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[PointsHistorique]:
    stmt = (
        select(PointsHistorique)
        .where(PointsHistorique.carte_id == carte_id)
        .order_by(PointsHistorique.created_at.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(db.execute(stmt).scalars())


# ── Campagnes de Recrutement ─────────────────


@router.post("/campagnes", response_model=CampagneRecrutementOut, status_code=201)
def create_campagne_recrutement(
    payload: CampagneRecrutementCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> CampagneRecrutement:
    campagne = CampagneRecrutement(**payload.model_dump())
    db.add(campagne)
    db.flush()
    log_event(
        db,
        aggregate_type="campagne_recrutement",
        aggregate_id=campagne.id,
        event_type="campagne_recrutement.creee",
        payload={"nom": campagne.nom, "canal": campagne.canal},
    )
    db.commit()
    db.refresh(campagne)
    return campagne


@router.get("/campagnes", response_model=list[CampagneRecrutementOut])
def list_campagnes_recrutement(
    statut: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[CampagneRecrutement]:
    stmt = select(CampagneRecrutement)
    if statut:
        stmt = stmt.where(CampagneRecrutement.statut == statut)
    return list(
        db.execute(
            stmt.order_by(CampagneRecrutement.created_at.desc()).offset(offset).limit(limit)
        ).scalars()
    )


@router.get("/campagnes/{campagne_id}", response_model=CampagneRecrutementOut)
def get_campagne_recrutement(
    campagne_id: uuid.UUID, db: Session = Depends(get_db)
) -> CampagneRecrutement:
    campagne = db.get(CampagneRecrutement, campagne_id)
    if campagne is None:
        raise HTTPException(status_code=404, detail="campagne introuvable")
    return campagne


@router.patch("/campagnes/{campagne_id}", response_model=CampagneRecrutementOut)
def update_campagne_recrutement(
    campagne_id: uuid.UUID,
    payload: CampagneRecrutementUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> CampagneRecrutement:
    campagne = db.get(CampagneRecrutement, campagne_id)
    if campagne is None:
        raise HTTPException(status_code=404, detail="campagne introuvable")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(campagne, field, value)
    log_event(
        db,
        aggregate_type="campagne_recrutement",
        aggregate_id=campagne.id,
        event_type="campagne_recrutement.modifiee",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(campagne)
    return campagne
