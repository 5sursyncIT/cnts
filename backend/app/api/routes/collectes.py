import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import CampagneCollecte, InscriptionCollecte, UserAccount
from app.db.session import get_db
from app.schemas.collectes import (
    CampagneCollecteCreate,
    CampagneCollecteOut,
    CampagneCollecteUpdate,
    InscriptionCollecteCreate,
    InscriptionCollecteOut,
)

router = APIRouter(prefix="/collectes")


@router.post("", response_model=CampagneCollecteOut, status_code=201)
def create_campagne(
    payload: CampagneCollecteCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> CampagneCollecte:
    existing = db.execute(
        select(CampagneCollecte).where(CampagneCollecte.code == payload.code)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="une campagne avec ce code existe deja")

    campagne = CampagneCollecte(**payload.model_dump())
    db.add(campagne)
    db.flush()

    log_event(
        db,
        aggregate_type="campagne_collecte",
        aggregate_id=campagne.id,
        event_type="campagne.creee",
        payload={"code": campagne.code, "type": campagne.type_campagne},
    )
    db.commit()
    db.refresh(campagne)
    return campagne


@router.get("", response_model=list[CampagneCollecteOut])
def list_campagnes(
    type_campagne: str | None = Query(default=None),
    statut: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[CampagneCollecte]:
    stmt = select(CampagneCollecte)
    if type_campagne:
        stmt = stmt.where(CampagneCollecte.type_campagne == type_campagne)
    if statut:
        stmt = stmt.where(CampagneCollecte.statut == statut)
    return list(
        db.execute(
            stmt.order_by(CampagneCollecte.date_debut.desc()).offset(offset).limit(limit)
        ).scalars()
    )


@router.get("/calendrier", response_model=list[CampagneCollecteOut])
def calendrier_collectes(
    db: Session = Depends(get_db),
) -> list[CampagneCollecte]:
    stmt = (
        select(CampagneCollecte)
        .where(CampagneCollecte.statut.in_(["PLANIFIEE", "EN_COURS"]))
        .order_by(CampagneCollecte.date_debut)
    )
    return list(db.execute(stmt).scalars())


@router.get("/{campagne_id}", response_model=CampagneCollecteOut)
def get_campagne(campagne_id: uuid.UUID, db: Session = Depends(get_db)) -> CampagneCollecte:
    campagne = db.get(CampagneCollecte, campagne_id)
    if campagne is None:
        raise HTTPException(status_code=404, detail="campagne introuvable")
    return campagne


@router.put("/{campagne_id}", response_model=CampagneCollecteOut)
def update_campagne(
    campagne_id: uuid.UUID,
    payload: CampagneCollecteUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> CampagneCollecte:
    campagne = db.get(CampagneCollecte, campagne_id)
    if campagne is None:
        raise HTTPException(status_code=404, detail="campagne introuvable")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(campagne, field, value)

    log_event(
        db,
        aggregate_type="campagne_collecte",
        aggregate_id=campagne.id,
        event_type="campagne.modifiee",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(campagne)
    return campagne


@router.post("/{campagne_id}/demarrer", response_model=CampagneCollecteOut)
def demarrer_campagne(
    campagne_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> CampagneCollecte:
    campagne = db.get(CampagneCollecte, campagne_id)
    if campagne is None:
        raise HTTPException(status_code=404, detail="campagne introuvable")
    if campagne.statut != "PLANIFIEE":
        raise HTTPException(
            status_code=409, detail="campagne ne peut etre demarree que depuis le statut PLANIFIEE"
        )

    campagne.statut = "EN_COURS"
    log_event(
        db,
        aggregate_type="campagne_collecte",
        aggregate_id=campagne.id,
        event_type="campagne.demarree",
        payload={},
    )
    db.commit()
    db.refresh(campagne)
    return campagne


@router.post("/{campagne_id}/terminer", response_model=CampagneCollecteOut)
def terminer_campagne(
    campagne_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> CampagneCollecte:
    campagne = db.get(CampagneCollecte, campagne_id)
    if campagne is None:
        raise HTTPException(status_code=404, detail="campagne introuvable")
    if campagne.statut != "EN_COURS":
        raise HTTPException(
            status_code=409, detail="campagne ne peut etre terminee que depuis le statut EN_COURS"
        )

    campagne.statut = "TERMINEE"
    log_event(
        db,
        aggregate_type="campagne_collecte",
        aggregate_id=campagne.id,
        event_type="campagne.terminee",
        payload={},
    )
    db.commit()
    db.refresh(campagne)
    return campagne


@router.get("/{campagne_id}/bilan")
def bilan_campagne(campagne_id: uuid.UUID, db: Session = Depends(get_db)) -> dict:
    campagne = db.execute(
        select(CampagneCollecte)
        .where(CampagneCollecte.id == campagne_id)
        .options(selectinload(CampagneCollecte.inscriptions))
    ).scalar_one_or_none()
    if campagne is None:
        raise HTTPException(status_code=404, detail="campagne introuvable")

    inscrits = len(campagne.inscriptions)
    presents = sum(1 for i in campagne.inscriptions if i.statut in ("PRESENT", "PRELEVE"))
    preleves = sum(1 for i in campagne.inscriptions if i.statut == "PRELEVE")
    absents = sum(1 for i in campagne.inscriptions if i.statut == "ABSENT")

    return {
        "campagne_id": str(campagne.id),
        "code": campagne.code,
        "objectif_dons": campagne.objectif_dons,
        "inscrits": inscrits,
        "presents": presents,
        "preleves": preleves,
        "absents": absents,
        "taux_presence": round(presents / inscrits * 100, 1) if inscrits > 0 else 0,
        "taux_realisation": round(preleves / campagne.objectif_dons * 100, 1)
        if campagne.objectif_dons
        else None,
    }


# ── Inscriptions ────────────────────────────


@router.post("/{campagne_id}/inscriptions", response_model=InscriptionCollecteOut, status_code=201)
def create_inscription(
    campagne_id: uuid.UUID,
    payload: InscriptionCollecteCreate,
    db: Session = Depends(get_db),
) -> InscriptionCollecte:
    campagne = db.get(CampagneCollecte, campagne_id)
    if campagne is None:
        raise HTTPException(status_code=404, detail="campagne introuvable")

    inscription = InscriptionCollecte(
        campagne_id=campagne_id,
        donneur_id=payload.donneur_id,
        nom=payload.nom,
        telephone=payload.telephone,
        creneau=payload.creneau,
    )
    db.add(inscription)
    db.commit()
    db.refresh(inscription)
    return inscription


@router.get("/{campagne_id}/inscriptions", response_model=list[InscriptionCollecteOut])
def list_inscriptions(
    campagne_id: uuid.UUID,
    statut: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[InscriptionCollecte]:
    stmt = select(InscriptionCollecte).where(InscriptionCollecte.campagne_id == campagne_id)
    if statut:
        stmt = stmt.where(InscriptionCollecte.statut == statut)
    return list(
        db.execute(stmt.order_by(InscriptionCollecte.creneau).offset(offset).limit(limit)).scalars()
    )
