import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import Equipement, InterventionEquipement, UserAccount
from app.db.session import get_db
from app.schemas.equipements import (
    EquipementCreate,
    EquipementOut,
    EquipementUpdate,
    InterventionEquipementCreate,
    InterventionEquipementOut,
)

router = APIRouter(prefix="/equipements")


@router.post("", response_model=EquipementOut, status_code=201)
def create_equipement(
    payload: EquipementCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Equipement:
    existing = db.execute(
        select(Equipement).where(Equipement.code_inventaire == payload.code_inventaire)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=409, detail="un equipement avec ce code inventaire existe deja"
        )

    equipement = Equipement(**payload.model_dump())
    db.add(equipement)
    db.flush()
    log_event(
        db,
        aggregate_type="equipement",
        aggregate_id=equipement.id,
        event_type="equipement.cree",
        payload={"code": equipement.code_inventaire},
    )
    db.commit()
    db.refresh(equipement)
    return equipement


@router.get("", response_model=list[EquipementOut])
def list_equipements(
    categorie: str | None = Query(default=None),
    statut: str | None = Query(default=None),
    site_id: uuid.UUID | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[Equipement]:
    stmt = select(Equipement)
    if categorie:
        stmt = stmt.where(Equipement.categorie == categorie)
    if statut:
        stmt = stmt.where(Equipement.statut == statut)
    if site_id:
        stmt = stmt.where(Equipement.site_id == site_id)
    return list(db.execute(stmt.order_by(Equipement.nom).offset(offset).limit(limit)).scalars())


@router.get("/{equipement_id}", response_model=EquipementOut)
def get_equipement(equipement_id: uuid.UUID, db: Session = Depends(get_db)) -> Equipement:
    equipement = db.get(Equipement, equipement_id)
    if equipement is None:
        raise HTTPException(status_code=404, detail="equipement introuvable")
    return equipement


@router.patch("/{equipement_id}", response_model=EquipementOut)
def update_equipement(
    equipement_id: uuid.UUID,
    payload: EquipementUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Equipement:
    equipement = db.get(Equipement, equipement_id)
    if equipement is None:
        raise HTTPException(status_code=404, detail="equipement introuvable")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(equipement, field, value)
    log_event(
        db,
        aggregate_type="equipement",
        aggregate_id=equipement.id,
        event_type="equipement.modifie",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(equipement)
    return equipement


# ── Interventions ────────────────────────────


@router.post(
    "/{equipement_id}/interventions", response_model=InterventionEquipementOut, status_code=201
)
def create_intervention(
    equipement_id: uuid.UUID,
    payload: InterventionEquipementCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> InterventionEquipement:
    equipement = db.get(Equipement, equipement_id)
    if equipement is None:
        raise HTTPException(status_code=404, detail="equipement introuvable")

    intervention = InterventionEquipement(**payload.model_dump())
    db.add(intervention)
    db.flush()

    # Update prochaine dates based on intervention type
    if payload.prochaine_date:
        if payload.type_intervention in ("MAINTENANCE_PREVENTIVE", "MAINTENANCE_CORRECTIVE"):
            equipement.date_prochaine_maintenance = payload.prochaine_date
        elif payload.type_intervention == "CALIBRATION":
            equipement.date_prochaine_calibration = payload.prochaine_date

    log_event(
        db,
        aggregate_type="equipement",
        aggregate_id=equipement.id,
        event_type="equipement.intervention",
        payload={"type": payload.type_intervention, "resultat": payload.resultat},
    )
    db.commit()
    db.refresh(intervention)
    return intervention


@router.get("/{equipement_id}/interventions", response_model=list[InterventionEquipementOut])
def list_interventions(
    equipement_id: uuid.UUID,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[InterventionEquipement]:
    stmt = (
        select(InterventionEquipement)
        .where(InterventionEquipement.equipement_id == equipement_id)
        .order_by(InterventionEquipement.date_intervention.desc())
        .offset(offset)
        .limit(limit)
    )
    return list(db.execute(stmt).scalars())
