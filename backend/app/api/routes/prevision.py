import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import Poche, PrevisionStock, SeuilAlerte, UserAccount
from app.db.session import get_db
from app.schemas.prevision import (
    PrevisionStockOut,
    SeuilAlerteCreate,
    SeuilAlerteOut,
    SeuilAlerteUpdate,
)

router = APIRouter(prefix="/prevision")


# ── Seuils d'alerte ──────────────────────────


@router.post("/seuils", response_model=SeuilAlerteOut, status_code=201)
def create_seuil(
    payload: SeuilAlerteCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> SeuilAlerte:
    seuil = SeuilAlerte(**payload.model_dump())
    db.add(seuil)
    db.flush()

    log_event(
        db,
        aggregate_type="seuil_alerte",
        aggregate_id=seuil.id,
        event_type="seuil.cree",
        payload={"type_produit": payload.type_produit, "groupe_sanguin": payload.groupe_sanguin},
    )
    db.commit()
    db.refresh(seuil)
    return seuil


@router.get("/seuils", response_model=list[SeuilAlerteOut])
def list_seuils(
    type_produit: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[SeuilAlerte]:
    stmt = select(SeuilAlerte)
    if type_produit:
        stmt = stmt.where(SeuilAlerte.type_produit == type_produit)
    if is_active is not None:
        stmt = stmt.where(SeuilAlerte.is_active == is_active)
    return list(
        db.execute(stmt.order_by(SeuilAlerte.type_produit).offset(offset).limit(limit)).scalars()
    )


@router.put("/seuils/{seuil_id}", response_model=SeuilAlerteOut)
def update_seuil(
    seuil_id: uuid.UUID,
    payload: SeuilAlerteUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> SeuilAlerte:
    seuil = db.get(SeuilAlerte, seuil_id)
    if seuil is None:
        raise HTTPException(status_code=404, detail="seuil introuvable")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(seuil, field, value)

    log_event(
        db,
        aggregate_type="seuil_alerte",
        aggregate_id=seuil.id,
        event_type="seuil.modifie",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(seuil)
    return seuil


# ── Previsions ────────────────────────────────


@router.get("/stock", response_model=list[PrevisionStockOut])
def list_previsions(
    type_produit: str | None = Query(default=None),
    groupe_sanguin: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[PrevisionStock]:
    stmt = select(PrevisionStock)
    if type_produit:
        stmt = stmt.where(PrevisionStock.type_produit == type_produit)
    if groupe_sanguin:
        stmt = stmt.where(PrevisionStock.groupe_sanguin == groupe_sanguin)
    return list(
        db.execute(
            stmt.order_by(PrevisionStock.date_prevision.desc()).offset(offset).limit(limit)
        ).scalars()
    )


# ── Alertes en cours ─────────────────────────


@router.get("/alertes")
def alertes_stock(
    site_id: uuid.UUID | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[dict]:
    seuils_stmt = select(SeuilAlerte).where(SeuilAlerte.is_active.is_(True))
    if site_id:
        seuils_stmt = seuils_stmt.where(SeuilAlerte.site_id == site_id)
    seuils = list(db.execute(seuils_stmt).scalars())

    alertes = []
    for seuil in seuils:
        stock_stmt = select(func.count(Poche.id)).where(
            Poche.type_produit == seuil.type_produit,
            Poche.statut_distribution == "DISPONIBLE",
        )
        if seuil.groupe_sanguin:
            stock_stmt = stock_stmt.where(Poche.groupe_sanguin == seuil.groupe_sanguin)
        stock_count = db.execute(stock_stmt).scalar() or 0

        if stock_count <= seuil.seuil_critique:
            niveau = "CRITIQUE"
        elif stock_count <= seuil.seuil_alerte:
            niveau = "ALERTE"
        elif stock_count <= seuil.seuil_confort:
            niveau = "ATTENTION"
        else:
            continue

        alertes.append(
            {
                "type_produit": seuil.type_produit,
                "groupe_sanguin": seuil.groupe_sanguin,
                "stock_actuel": stock_count,
                "seuil_critique": seuil.seuil_critique,
                "seuil_alerte": seuil.seuil_alerte,
                "seuil_confort": seuil.seuil_confort,
                "niveau": niveau,
            }
        )

    return alertes
