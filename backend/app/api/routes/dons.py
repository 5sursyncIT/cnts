import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.audit.events import log_event
from app.core.din import generate_din
from app.core.idempotency import get_idempotent_response, store_idempotent_response
from app.db.models import Don, Donneur, Poche
from app.db.session import get_db
from app.schemas.dons import DonCreate, DonOut, EtiquetteOut

router = APIRouter(prefix="/dons")


@router.post("", response_model=DonOut, status_code=201)
def create_don(payload: DonCreate, db: Session = Depends(get_db)) -> JSONResponse | Don:
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
    if donneur is None:
        raise HTTPException(status_code=404, detail="donneur not found")

    din = generate_din(db, date_don=payload.date_don)
    don = Don(
        donneur_id=payload.donneur_id,
        din=din,
        date_don=payload.date_don,
        type_don=payload.type_don,
        statut_qualification="EN_ATTENTE",
    )
    db.add(don)

    donneur.dernier_don = payload.date_don

    poche = Poche(
        don=don,
        type_produit="ST",
        volume_ml=450,
        date_peremption=payload.date_don + dt.timedelta(days=35),
        emplacement_stock="COLLECTE",
        statut_distribution="NON_DISTRIBUABLE",
    )
    db.add(poche)

    db.commit()
    db.refresh(don)

    log_event(
        db,
        aggregate_type="don",
        aggregate_id=don.id,
        event_type="don.created",
        payload={"din": don.din, "donneur_id": str(don.donneur_id), "type_don": don.type_don},
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
    db: Session = Depends(get_db)
) -> list[Don]:
    stmt = select(Don).options(joinedload(Don.donneur)).order_by(Don.created_at.desc())
    
    if statut:
        stmt = stmt.where(Don.statut_qualification == statut)
    
    if donneur_id:
        stmt = stmt.where(Don.donneur_id == donneur_id)
        
    stmt = stmt.offset(offset).limit(limit)
    return list(db.execute(stmt).scalars())


@router.get("/{don_id}", response_model=DonOut)
def get_don(don_id: uuid.UUID, db: Session = Depends(get_db)) -> Don:
    stmt = select(Don).options(joinedload(Don.donneur)).where(Don.id == don_id)
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
