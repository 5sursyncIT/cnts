import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import Donneur, Phenotypage, RegistreGroupeRare, UserAccount
from app.db.session import get_db
from app.schemas.phenotypage import (
    PhenotypageCreate,
    PhenotypageOut,
    RegistreGroupeRareCreate,
    RegistreGroupeRareOut,
    RegistreGroupeRareUpdate,
)

router = APIRouter(prefix="/phenotypage")


# ── Phenotypage ──────────────────────────────


@router.post("", response_model=PhenotypageOut, status_code=201)
def create_phenotypage(
    payload: PhenotypageCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Phenotypage:
    donneur = db.get(Donneur, payload.donneur_id)
    if donneur is None:
        raise HTTPException(status_code=404, detail="donneur introuvable")

    existing = db.execute(
        select(Phenotypage).where(
            Phenotypage.donneur_id == payload.donneur_id,
            Phenotypage.systeme == payload.systeme,
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=409, detail=f"phenotypage {payload.systeme} deja enregistre pour ce donneur"
        )

    pheno = Phenotypage(**payload.model_dump())
    db.add(pheno)
    db.flush()

    log_event(
        db,
        aggregate_type="phenotypage",
        aggregate_id=pheno.id,
        event_type="phenotypage.cree",
        payload={"donneur_id": str(payload.donneur_id), "systeme": payload.systeme},
    )
    db.commit()
    db.refresh(pheno)
    return pheno


@router.get("", response_model=list[PhenotypageOut])
def list_phenotypages(
    donneur_id: uuid.UUID | None = Query(default=None),
    systeme: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[Phenotypage]:
    stmt = select(Phenotypage)
    if donneur_id:
        stmt = stmt.where(Phenotypage.donneur_id == donneur_id)
    if systeme:
        stmt = stmt.where(Phenotypage.systeme == systeme)
    return list(
        db.execute(
            stmt.order_by(Phenotypage.created_at.desc()).offset(offset).limit(limit)
        ).scalars()
    )


@router.get("/{phenotypage_id}", response_model=PhenotypageOut)
def get_phenotypage(phenotypage_id: uuid.UUID, db: Session = Depends(get_db)) -> Phenotypage:
    pheno = db.get(Phenotypage, phenotypage_id)
    if pheno is None:
        raise HTTPException(status_code=404, detail="phenotypage introuvable")
    return pheno


@router.post("/{phenotypage_id}/confirmer", response_model=PhenotypageOut)
def confirmer_phenotypage(
    phenotypage_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Phenotypage:
    pheno = db.get(Phenotypage, phenotypage_id)
    if pheno is None:
        raise HTTPException(status_code=404, detail="phenotypage introuvable")
    if pheno.is_confirmed:
        raise HTTPException(status_code=409, detail="phenotypage deja confirme")

    pheno.is_confirmed = True

    log_event(
        db,
        aggregate_type="phenotypage",
        aggregate_id=pheno.id,
        event_type="phenotypage.confirme",
        payload={"systeme": pheno.systeme},
    )
    db.commit()
    db.refresh(pheno)
    return pheno


# ── Registre Groupes Rares ───────────────────


@router.post("/groupes-rares", response_model=RegistreGroupeRareOut, status_code=201)
def create_groupe_rare(
    payload: RegistreGroupeRareCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> RegistreGroupeRare:
    donneur = db.get(Donneur, payload.donneur_id)
    if donneur is None:
        raise HTTPException(status_code=404, detail="donneur introuvable")

    existing = db.execute(
        select(RegistreGroupeRare).where(RegistreGroupeRare.donneur_id == payload.donneur_id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=409, detail="donneur deja inscrit au registre des groupes rares"
        )

    entry = RegistreGroupeRare(**payload.model_dump())
    db.add(entry)
    db.flush()

    log_event(
        db,
        aggregate_type="registre_groupe_rare",
        aggregate_id=entry.id,
        event_type="groupe_rare.inscrit",
        payload={"donneur_id": str(payload.donneur_id), "rarete": payload.rarete},
    )
    db.commit()
    db.refresh(entry)
    return entry


@router.get("/groupes-rares", response_model=list[RegistreGroupeRareOut])
def list_groupes_rares(
    rarete: str | None = Query(default=None),
    disponible: bool | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[RegistreGroupeRare]:
    stmt = select(RegistreGroupeRare)
    if rarete:
        stmt = stmt.where(RegistreGroupeRare.rarete == rarete)
    if disponible is not None:
        stmt = stmt.where(RegistreGroupeRare.disponible == disponible)
    return list(
        db.execute(
            stmt.order_by(RegistreGroupeRare.created_at.desc()).offset(offset).limit(limit)
        ).scalars()
    )


@router.get("/groupes-rares/recherche", response_model=list[RegistreGroupeRareOut])
def rechercher_groupes_rares(
    q: str = Query(min_length=1),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[RegistreGroupeRare]:
    stmt = (
        select(RegistreGroupeRare)
        .where(
            RegistreGroupeRare.disponible.is_(True),
            RegistreGroupeRare.phenotype_resume.ilike(f"%{q}%"),
        )
        .order_by(RegistreGroupeRare.rarete)
        .offset(offset)
        .limit(limit)
    )
    return list(db.execute(stmt).scalars())


@router.put("/groupes-rares/{entry_id}", response_model=RegistreGroupeRareOut)
def update_groupe_rare(
    entry_id: uuid.UUID,
    payload: RegistreGroupeRareUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> RegistreGroupeRare:
    entry = db.get(RegistreGroupeRare, entry_id)
    if entry is None:
        raise HTTPException(status_code=404, detail="entree registre introuvable")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)

    log_event(
        db,
        aggregate_type="registre_groupe_rare",
        aggregate_id=entry.id,
        event_type="groupe_rare.modifie",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(entry)
    return entry
