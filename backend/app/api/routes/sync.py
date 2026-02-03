import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.audit.events import TraceEvent, log_event
from app.core.din import generate_din
from app.core.security import hash_cni
from app.core.sync_cursor import decode_cursor, encode_cursor
from app.db.models import Don, Donneur, Poche, SyncDevice, SyncIngestedEvent
from app.db.session import get_db
from app.schemas.sync import SyncPullEventOut, SyncPullOut, SyncPushEventResult, SyncPushIn, SyncPushOut

router = APIRouter(prefix="/sync")


@router.get("/events", response_model=SyncPullOut)
def pull_events(
    cursor: str | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> SyncPullOut:
    stmt = select(TraceEvent).order_by(TraceEvent.created_at.asc(), TraceEvent.id.asc()).limit(limit)
    if cursor:
        created_at, event_id = decode_cursor(cursor)
        stmt = stmt.where(
            or_(
                TraceEvent.created_at > created_at,
                and_(TraceEvent.created_at == created_at, TraceEvent.id > event_id),
            )
        )

    rows = list(db.execute(stmt).scalars())
    next_cursor = encode_cursor(created_at=rows[-1].created_at, event_id=rows[-1].id) if rows else None
    return SyncPullOut(events=[SyncPullEventOut.model_validate(r) for r in rows], next_cursor=next_cursor)


@router.post("/events", response_model=SyncPushOut)
def push_events(payload: SyncPushIn, db: Session = Depends(get_db)) -> SyncPushOut:
    device = db.execute(select(SyncDevice).where(SyncDevice.device_id == payload.device_id)).scalar_one_or_none()
    if device is None:
        device = SyncDevice(device_id=payload.device_id)
        db.add(device)
        db.commit()
        db.refresh(device)
    else:
        device.last_seen_at = dt.datetime.now(dt.timezone.utc)
        db.commit()

    results: list[SyncPushEventResult] = []
    for ev in payload.events:
        existing = db.execute(
            select(SyncIngestedEvent).where(
                SyncIngestedEvent.sync_device_id == device.id,
                SyncIngestedEvent.client_event_id == ev.client_event_id,
            )
        ).scalar_one_or_none()
        if existing is not None:
            results.append(
                SyncPushEventResult(
                    client_event_id=ev.client_event_id,
                    status="DUPLICATE",
                    error_code=existing.error_code,
                    error_message=existing.error_message,
                    response=existing.response_json,
                )
            )
            continue

        try:
            response_json = _apply_mobile_event(db, device_id=payload.device_id, event_type=ev.type, payload=ev.payload)
            row = SyncIngestedEvent(
                sync_device_id=device.id,
                client_event_id=ev.client_event_id,
                event_type=ev.type,
                payload=ev.payload,
                status="ACCEPTE",
                response_json=response_json,
            )
            db.add(row)
            db.commit()
            results.append(
                SyncPushEventResult(
                    client_event_id=ev.client_event_id,
                    status="ACCEPTE",
                    response=response_json,
                )
            )
        except HTTPException as e:
            row = SyncIngestedEvent(
                sync_device_id=device.id,
                client_event_id=ev.client_event_id,
                event_type=ev.type,
                payload=ev.payload,
                status="REJETE",
                error_code=str(e.status_code),
                error_message=str(e.detail),
            )
            db.add(row)
            db.commit()
            results.append(
                SyncPushEventResult(
                    client_event_id=ev.client_event_id,
                    status="REJETE",
                    error_code=str(e.status_code),
                    error_message=str(e.detail),
                )
            )
        except Exception as e:
            row = SyncIngestedEvent(
                sync_device_id=device.id,
                client_event_id=ev.client_event_id,
                event_type=ev.type,
                payload=ev.payload,
                status="REJETE",
                error_code="500",
                error_message=str(e),
            )
            db.add(row)
            db.commit()
            results.append(
                SyncPushEventResult(
                    client_event_id=ev.client_event_id,
                    status="REJETE",
                    error_code="500",
                    error_message="erreur interne",
                )
            )

    return SyncPushOut(device_id=payload.device_id, results=results)


def _apply_mobile_event(db: Session, *, device_id: str, event_type: str, payload: dict) -> dict:
    if event_type == "donneur.upsert":
        cni = payload.get("cni")
        nom = payload.get("nom")
        prenom = payload.get("prenom")
        sexe = payload.get("sexe")
        if not cni or not nom or not prenom or not sexe:
            raise HTTPException(status_code=422, detail="payload donneur invalide")
        if sexe not in {"H", "F"}:
            raise HTTPException(status_code=422, detail="sexe invalide")

        cni_h = hash_cni(str(cni))
        existing = db.execute(select(Donneur).where(Donneur.cni_hash == cni_h)).scalar_one_or_none()
        if existing is None:
            existing = Donneur(cni_hash=cni_h, nom=str(nom), prenom=str(prenom), sexe=str(sexe), dernier_don=None)
            db.add(existing)
            db.commit()
            db.refresh(existing)

        log_event(
            db,
            aggregate_type="donneur",
            aggregate_id=existing.id,
            event_type="donneur.upserted",
            payload={"donneur_id": str(existing.id), "cni_hash": existing.cni_hash, "device_id": device_id},
        )
        db.commit()
        return {"donneur_id": str(existing.id)}

    if event_type == "don.create":
        donneur_cni = payload.get("donneur_cni")
        date_don = payload.get("date_don")
        type_don = payload.get("type_don")
        if not donneur_cni or not date_don or not type_don:
            raise HTTPException(status_code=422, detail="payload don invalide")
        try:
            date_don_parsed = dt.date.fromisoformat(str(date_don))
        except Exception:
            raise HTTPException(status_code=422, detail="date_don invalide")

        cni_h = hash_cni(str(donneur_cni))
        donneur = db.execute(select(Donneur).where(Donneur.cni_hash == cni_h)).scalar_one_or_none()
        if donneur is None:
            raise HTTPException(status_code=409, detail="donneur introuvable (upsert requis)")

        din = generate_din(db, date_don=date_don_parsed)
        don = Don(
            donneur_id=donneur.id,
            din=din,
            date_don=date_don_parsed,
            type_don=str(type_don),
            statut_qualification="EN_ATTENTE",
        )
        db.add(don)
        donneur.dernier_don = date_don_parsed
        poche = Poche(
            don=don,
            type_produit="ST",
            volume_ml=450,
            date_peremption=date_don_parsed + dt.timedelta(days=35),
            emplacement_stock="COLLECTE",
            statut_distribution="NON_DISTRIBUABLE",
            statut_stock="EN_STOCK",
        )
        db.add(poche)
        db.commit()
        db.refresh(don)
        db.refresh(poche)

        log_event(
            db,
            aggregate_type="don",
            aggregate_id=don.id,
            event_type="don.created",
            payload={
                "din": don.din,
                "donneur_id": str(don.donneur_id),
                "type_don": don.type_don,
                "device_id": device_id,
            },
        )
        db.commit()
        return {"don_id": str(don.id), "din": don.din, "poche_st_id": str(poche.id)}

    raise HTTPException(status_code=422, detail="event_type inconnu")

