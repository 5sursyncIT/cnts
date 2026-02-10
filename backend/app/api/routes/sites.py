import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import LigneTransfert, Poche, Site, TransfertInterSite, UserAccount
from app.db.session import get_db
from app.schemas.sites import SiteCreate, SiteOut, SiteUpdate, TransfertCreate, TransfertOut

router = APIRouter(prefix="/sites")


# ── Sites CRUD ────────────────────────────────

@router.post("", response_model=SiteOut, status_code=201)
def create_site(
    payload: SiteCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Site:
    existing = db.execute(select(Site).where(Site.code == payload.code)).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="un site avec ce code existe deja")

    site = Site(**payload.model_dump())
    db.add(site)
    db.flush()

    log_event(
        db,
        aggregate_type="site",
        aggregate_id=site.id,
        event_type="site.cree",
        payload={"code": site.code, "nom": site.nom, "type_site": site.type_site},
    )
    db.commit()
    db.refresh(site)
    return site


@router.get("", response_model=list[SiteOut])
def list_sites(
    type_site: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[Site]:
    stmt = select(Site)
    if type_site:
        stmt = stmt.where(Site.type_site == type_site)
    if is_active is not None:
        stmt = stmt.where(Site.is_active == is_active)
    return list(db.execute(stmt.order_by(Site.nom).offset(offset).limit(limit)).scalars())


# ── Transferts inter-sites ────────────────────
# NOTE: These literal /transferts routes MUST come before /{site_id} to avoid
# FastAPI matching "transferts" as a UUID path parameter.

@router.post("/transferts", response_model=TransfertOut, status_code=201)
def create_transfert(
    payload: TransfertCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> TransfertInterSite:
    # Validate destination site
    dest = db.get(Site, payload.site_destination_id)
    if dest is None:
        raise HTTPException(status_code=404, detail="site de destination introuvable")

    # Validate all bags exist and are available
    lignes = []
    for poche_id in payload.poche_ids:
        poche = db.get(Poche, poche_id)
        if poche is None:
            raise HTTPException(status_code=404, detail=f"poche {poche_id} introuvable")
        if poche.statut_distribution not in ("DISPONIBLE", "EN_STOCK"):
            raise HTTPException(
                status_code=409,
                detail=f"poche {poche_id} non disponible pour transfert (statut: {poche.statut_distribution})",
            )
        lignes.append(LigneTransfert(poche_id=poche_id))

    transfert = TransfertInterSite(
        site_source_id=uuid.uuid4(),  # TODO: use current user's site_id
        site_destination_id=payload.site_destination_id,
        motif=payload.motif,
    )
    transfert.lignes = lignes
    db.add(transfert)
    db.flush()

    log_event(
        db,
        aggregate_type="transfert",
        aggregate_id=transfert.id,
        event_type="transfert.cree",
        payload={
            "destination": str(payload.site_destination_id),
            "nb_poches": len(payload.poche_ids),
        },
    )
    db.commit()

    # Re-fetch with relationships
    transfert = db.execute(
        select(TransfertInterSite)
        .where(TransfertInterSite.id == transfert.id)
        .options(selectinload(TransfertInterSite.lignes))
    ).scalar_one()
    return transfert


@router.get("/transferts", response_model=list[TransfertOut])
def list_transferts(
    statut: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[TransfertInterSite]:
    stmt = select(TransfertInterSite).options(selectinload(TransfertInterSite.lignes))
    if statut:
        stmt = stmt.where(TransfertInterSite.statut == statut)
    return list(
        db.execute(
            stmt.order_by(TransfertInterSite.created_at.desc()).offset(offset).limit(limit)
        ).scalars()
    )


@router.post("/transferts/{transfert_id}/expedier", response_model=TransfertOut)
def expedier_transfert(
    transfert_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> TransfertInterSite:
    transfert = db.execute(
        select(TransfertInterSite)
        .where(TransfertInterSite.id == transfert_id)
        .options(selectinload(TransfertInterSite.lignes))
    ).scalar_one_or_none()
    if transfert is None:
        raise HTTPException(status_code=404, detail="transfert introuvable")
    if transfert.statut != "BROUILLON":
        raise HTTPException(status_code=409, detail="transfert deja expédie ou annulé")

    transfert.statut = "EN_TRANSIT"
    transfert.date_expedition = dt.datetime.now(dt.timezone.utc)

    # Mark bags as in transit
    for ligne in transfert.lignes:
        poche = db.get(Poche, ligne.poche_id)
        if poche:
            poche.statut_distribution = "RESERVE"

    log_event(
        db,
        aggregate_type="transfert",
        aggregate_id=transfert.id,
        event_type="transfert.expedie",
        payload={"nb_poches": len(transfert.lignes)},
    )
    db.commit()
    db.refresh(transfert)
    return transfert


@router.post("/transferts/{transfert_id}/recevoir", response_model=TransfertOut)
def recevoir_transfert(
    transfert_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> TransfertInterSite:
    transfert = db.execute(
        select(TransfertInterSite)
        .where(TransfertInterSite.id == transfert_id)
        .options(selectinload(TransfertInterSite.lignes))
    ).scalar_one_or_none()
    if transfert is None:
        raise HTTPException(status_code=404, detail="transfert introuvable")
    if transfert.statut != "EN_TRANSIT":
        raise HTTPException(status_code=409, detail="transfert non en transit")

    transfert.statut = "RECU"
    transfert.date_reception = dt.datetime.now(dt.timezone.utc)

    # Mark bags as available at destination
    for ligne in transfert.lignes:
        poche = db.get(Poche, ligne.poche_id)
        if poche:
            poche.statut_distribution = "DISPONIBLE"
        if ligne.statut_reception is None:
            ligne.statut_reception = "CONFORME"

    log_event(
        db,
        aggregate_type="transfert",
        aggregate_id=transfert.id,
        event_type="transfert.recu",
        payload={"nb_poches": len(transfert.lignes)},
    )
    db.commit()
    db.refresh(transfert)
    return transfert


@router.post("/transferts/{transfert_id}/annuler", response_model=TransfertOut)
def annuler_transfert(
    transfert_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> TransfertInterSite:
    transfert = db.execute(
        select(TransfertInterSite)
        .where(TransfertInterSite.id == transfert_id)
        .options(selectinload(TransfertInterSite.lignes))
    ).scalar_one_or_none()
    if transfert is None:
        raise HTTPException(status_code=404, detail="transfert introuvable")
    if transfert.statut not in ("BROUILLON", "EN_TRANSIT"):
        raise HTTPException(status_code=409, detail="transfert ne peut plus etre annulé")

    transfert.statut = "ANNULE"

    # Restore bags to available
    for ligne in transfert.lignes:
        poche = db.get(Poche, ligne.poche_id)
        if poche and poche.statut_distribution == "RESERVE":
            poche.statut_distribution = "DISPONIBLE"

    log_event(
        db,
        aggregate_type="transfert",
        aggregate_id=transfert.id,
        event_type="transfert.annule",
        payload={},
    )
    db.commit()
    db.refresh(transfert)
    return transfert


# ── Site detail (must come AFTER /transferts routes) ──

@router.get("/{site_id}", response_model=SiteOut)
def get_site(site_id: uuid.UUID, db: Session = Depends(get_db)) -> Site:
    site = db.get(Site, site_id)
    if site is None:
        raise HTTPException(status_code=404, detail="site introuvable")
    return site


@router.put("/{site_id}", response_model=SiteOut)
def update_site(
    site_id: uuid.UUID,
    payload: SiteUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Site:
    site = db.get(Site, site_id)
    if site is None:
        raise HTTPException(status_code=404, detail="site introuvable")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(site, field, value)

    log_event(
        db,
        aggregate_type="site",
        aggregate_id=site.id,
        event_type="site.modifie",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(site)
    return site
