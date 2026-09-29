import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.core.din import generate_din
from app.core.eligibilite import evaluer_eligibilite
from app.core.idempotency import get_idempotent_response, store_idempotent_response
from app.db.models import Don, Donneur, Poche, UserAccount
from app.db.session import get_db
from app.schemas.dons import DonCreate, DonDetailOut, DonOut, EtiquetteOut

router = APIRouter(prefix="/dons")


@router.post("", response_model=DonOut, status_code=201)
def create_don(
    payload: DonCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> JSONResponse | Don:
    scope = "create_don"
    if payload.idempotency_key:
        hit = get_idempotent_response(
            db,
            scope=scope,
            key=payload.idempotency_key,
            payload=payload.model_dump(),
        )
        if hit is not None:
            return JSONResponse(status_code=hit.status_code, content=hit.response_json)

    donneur = db.get(Donneur, payload.donneur_id)
    if donneur is None or donneur.deleted_at is not None:
        raise HTTPException(status_code=404, detail="donneur not found")
    if payload.date_don > dt.date.today():
        raise HTTPException(status_code=422, detail="La date du don ne peut pas être future")
    if payload.type_don not in {"SANG_TOTAL", "PLASMAPHERESE", "CYTAPHERESE"}:
        raise HTTPException(status_code=422, detail="Type de don non pris en charge")

    # Contrôle d'éligibilité côté serveur (délai inter-don / âge), évalué à la
    # date du don. Surclassable explicitement via ignorer_eligibilite.
    last_don = db.execute(
        select(Don)
        .where(Don.donneur_id == donneur.id, Don.date_don <= payload.date_don)
        .order_by(Don.date_don.desc(), Don.created_at.desc())
        .limit(1)
    ).scalar_one_or_none()
    next_don = db.execute(
        select(Don).where(Don.donneur_id == donneur.id, Don.date_don > payload.date_don)
        .order_by(Don.date_don.asc()).limit(1)
    ).scalar_one_or_none()
    elig = evaluer_eligibilite(
        sexe=donneur.sexe,
        date_naissance=donneur.date_naissance,
        dernier_don=last_don.date_don if last_don else None,
        dernier_type_don=last_don.type_don if last_don else None,
        ref_date=payload.date_don,
    )
    if not elig.eligible and not payload.ignorer_eligibilite:
        raise HTTPException(
            status_code=409,
            detail=f"Donneur non éligible à cette date : {elig.raison}",
        )
    if next_don is not None:
        next_elig = evaluer_eligibilite(
            sexe=donneur.sexe, date_naissance=donneur.date_naissance,
            dernier_don=payload.date_don, dernier_type_don=payload.type_don,
            ref_date=next_don.date_don,
        )
        if not next_elig.eligible and not payload.ignorer_eligibilite:
            raise HTTPException(
                status_code=409,
                detail="Don antidaté trop proche d'un don déjà enregistré",
            )
    if payload.ignorer_eligibilite and (
        _user is None or (_user.role or "").lower() not in {"admin", "medecin"}
    ):
        raise HTTPException(status_code=403, detail="Dérogation réservée à un médecin ou administrateur authentifié")

    din = generate_din(db, date_don=payload.date_don)
    don = Don(
        donneur_id=payload.donneur_id,
        din=din,
        date_don=payload.date_don,
        type_don=payload.type_don,
        statut_qualification="EN_ATTENTE",
    )
    db.add(don)

    # Ne jamais régresser dernier_don : un don antérieur (saisie rétroactive) ne
    # doit pas écraser une date de don plus récente.
    if donneur.dernier_don is None or payload.date_don > donneur.dernier_don:
        donneur.dernier_don = payload.date_don

    if payload.type_don == "SANG_TOTAL":
        db.add(Poche(
            don=don,
            type_produit="ST",
            volume_ml=450,
            date_peremption=payload.date_don + dt.timedelta(days=35),
            emplacement_stock="COLLECTE",
            statut_distribution="NON_DISTRIBUABLE",
        ))

    db.commit()
    db.refresh(don)

    log_event(
        db,
        aggregate_type="don",
        aggregate_id=don.id,
        event_type="don.created",
        payload={
            "din": don.din, "donneur_id": str(don.donneur_id), "type_don": don.type_don,
            "eligibilite_derogee": payload.ignorer_eligibilite,
            "motif_derogation": payload.motif_derogation if payload.ignorer_eligibilite else None,
            "validateur_id": str(_user.id) if payload.ignorer_eligibilite and _user else None,
        },
    )
    db.commit()

    response = DonOut.model_validate(don).model_dump(mode="json")
    if payload.idempotency_key:
        store_idempotent_response(
            db,
            scope=scope,
            key=payload.idempotency_key,
            payload=payload.model_dump(),
            status_code=201,
            response_json=response,
        )
        db.commit()
        return JSONResponse(status_code=201, content=response)
    return don


@router.get("", response_model=list[DonOut])
def list_dons(
    statut: str | None = None,
    donneur_id: uuid.UUID | None = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db),
) -> list[Don]:
    stmt = select(Don).options(joinedload(Don.donneur)).order_by(Don.created_at.desc())

    if statut:
        stmt = stmt.where(Don.statut_qualification == statut)

    if donneur_id:
        stmt = stmt.where(Don.donneur_id == donneur_id)

    stmt = stmt.offset(offset).limit(limit)
    return list(db.execute(stmt).scalars())


@router.get("/{don_id}", response_model=DonDetailOut)
def get_don(don_id: uuid.UUID, db: Session = Depends(get_db)) -> Don:
    stmt = select(Don).options(joinedload(Don.donneur), selectinload(Don.poches)).where(Don.id == don_id)
    row = db.execute(stmt).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="don not found")
    return row


@router.get("/{don_id}/etiquette", response_model=EtiquetteOut)
def etiquette(don_id: uuid.UUID, db: Session = Depends(get_db)) -> EtiquetteOut:
    row = db.get(Don, don_id)
    if row is None:
        raise HTTPException(status_code=404, detail="don not found")
    grp = db.execute(
        select(Poche.groupe_sanguin).where(Poche.don_id == don_id).limit(1)
    ).scalar_one_or_none()
    return EtiquetteOut(din=row.din, groupe_sanguin=grp)
