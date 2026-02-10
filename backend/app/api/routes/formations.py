import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import Formation, Habilitation, UserAccount
from app.db.session import get_db
from app.schemas.formations import (
    FormationCreate,
    FormationOut,
    FormationUpdate,
    HabilitationCreate,
    HabilitationOut,
)

router = APIRouter(prefix="/formations")


# ── Formations ───────────────────────────────


@router.post("", response_model=FormationOut, status_code=201)
def create_formation(
    payload: FormationCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Formation:
    existing = db.execute(
        select(Formation).where(Formation.code == payload.code)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="une formation avec ce code existe deja")

    formation = Formation(**payload.model_dump())
    db.add(formation)
    db.flush()
    log_event(
        db,
        aggregate_type="formation",
        aggregate_id=formation.id,
        event_type="formation.creee",
        payload={"code": formation.code},
    )
    db.commit()
    db.refresh(formation)
    return formation


@router.get("", response_model=list[FormationOut])
def list_formations(
    categorie: str | None = Query(default=None),
    is_obligatoire: bool | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[Formation]:
    stmt = select(Formation)
    if categorie:
        stmt = stmt.where(Formation.categorie == categorie)
    if is_obligatoire is not None:
        stmt = stmt.where(Formation.is_obligatoire == is_obligatoire)
    return list(db.execute(stmt.order_by(Formation.titre).offset(offset).limit(limit)).scalars())


@router.get("/{formation_id}", response_model=FormationOut)
def get_formation(formation_id: uuid.UUID, db: Session = Depends(get_db)) -> Formation:
    formation = db.get(Formation, formation_id)
    if formation is None:
        raise HTTPException(status_code=404, detail="formation introuvable")
    return formation


@router.patch("/{formation_id}", response_model=FormationOut)
def update_formation(
    formation_id: uuid.UUID,
    payload: FormationUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Formation:
    formation = db.get(Formation, formation_id)
    if formation is None:
        raise HTTPException(status_code=404, detail="formation introuvable")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(formation, field, value)
    log_event(
        db,
        aggregate_type="formation",
        aggregate_id=formation.id,
        event_type="formation.modifiee",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(formation)
    return formation


# ── Habilitations ────────────────────────────


@router.post("/habilitations", response_model=HabilitationOut, status_code=201)
def create_habilitation(
    payload: HabilitationCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Habilitation:
    habilitation = Habilitation(**payload.model_dump())
    db.add(habilitation)
    db.flush()
    log_event(
        db,
        aggregate_type="habilitation",
        aggregate_id=habilitation.id,
        event_type="habilitation.accordee",
        payload={"user_id": str(payload.user_id), "formation_id": str(payload.formation_id)},
    )
    db.commit()
    db.refresh(habilitation)
    return habilitation


@router.get("/habilitations", response_model=list[HabilitationOut])
def list_habilitations(
    user_id: uuid.UUID | None = Query(default=None),
    formation_id: uuid.UUID | None = Query(default=None),
    statut: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[Habilitation]:
    stmt = select(Habilitation)
    if user_id:
        stmt = stmt.where(Habilitation.user_id == user_id)
    if formation_id:
        stmt = stmt.where(Habilitation.formation_id == formation_id)
    if statut:
        stmt = stmt.where(Habilitation.statut == statut)
    return list(
        db.execute(
            stmt.order_by(Habilitation.date_obtention.desc()).offset(offset).limit(limit)
        ).scalars()
    )


@router.get("/matrice")
def matrice_competences(
    db: Session = Depends(get_db),
) -> list[dict]:
    """Returns a competence matrix: list of users with their formations and habilitation status."""
    users = list(db.execute(select(UserAccount).where(UserAccount.is_active.is_(True))).scalars())
    formations = list(db.execute(select(Formation)).scalars())

    matrice = []
    for user in users:
        habs = list(
            db.execute(select(Habilitation).where(Habilitation.user_id == user.id)).scalars()
        )
        hab_map = {h.formation_id: h.statut for h in habs}
        matrice.append(
            {
                "user_id": str(user.id),
                "email": user.email,
                "role": user.role,
                "formations": {
                    str(f.id): {
                        "titre": f.titre,
                        "statut": hab_map.get(f.id, "NON_FORMEE"),
                        "obligatoire": f.is_obligatoire,
                    }
                    for f in formations
                },
            }
        )
    return matrice
