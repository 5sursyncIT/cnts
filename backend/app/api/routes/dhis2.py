from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import DHIS2Export, Don, Donneur, Poche, UserAccount
from app.db.session import get_db
from app.schemas.dhis2 import DHIS2ExportCreate, DHIS2ExportOut

router = APIRouter(prefix="/dhis2")


@router.get("/exports", response_model=list[DHIS2ExportOut])
def list_exports(
    statut: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[DHIS2Export]:
    stmt = select(DHIS2Export)
    if statut:
        stmt = stmt.where(DHIS2Export.statut == statut)
    return list(
        db.execute(
            stmt.order_by(DHIS2Export.created_at.desc()).offset(offset).limit(limit)
        ).scalars()
    )


@router.post("/exports", response_model=DHIS2ExportOut, status_code=201)
def create_export(
    payload: DHIS2ExportCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> DHIS2Export:
    # Build aggregated data for the period
    indicators = _compute_indicators(db, payload.periode)

    export = DHIS2Export(
        periode=payload.periode,
        org_unit=payload.org_unit,
        data_set=payload.data_set,
        payload=indicators,
    )
    db.add(export)
    db.flush()
    log_event(
        db,
        aggregate_type="dhis2_export",
        aggregate_id=export.id,
        event_type="dhis2.export_cree",
        payload={"periode": payload.periode},
    )
    db.commit()
    db.refresh(export)
    return export


@router.get("/preview")
def preview_indicators(
    periode: str = Query(),
    db: Session = Depends(get_db),
) -> dict:
    return _compute_indicators(db, periode)


def _compute_indicators(db: Session, periode: str) -> dict:
    """Compute national blood transfusion indicators for a given period (YYYY-MM format)."""
    total_dons = db.execute(select(func.count(Don.id))).scalar() or 0
    total_donneurs = db.execute(select(func.count(Donneur.id))).scalar() or 0
    poches_disponibles = (
        db.execute(
            select(func.count(Poche.id)).where(Poche.statut_distribution == "DISPONIBLE")
        ).scalar()
        or 0
    )
    poches_distribuees = (
        db.execute(
            select(func.count(Poche.id)).where(Poche.statut_distribution == "DISTRIBUE")
        ).scalar()
        or 0
    )

    return {
        "periode": periode,
        "indicateurs": {
            "total_dons": total_dons,
            "total_donneurs_inscrits": total_donneurs,
            "poches_disponibles": poches_disponibles,
            "poches_distribuees": poches_distribuees,
        },
    }
