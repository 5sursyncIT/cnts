import uuid

import csv
import io
import datetime as dt

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import PlainTextResponse
from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production, require_staff
from app.audit.events import TraceEvent, log_event
from app.core.sync_cursor import decode_cursor, encode_cursor
from app.db.models import (
    ActeTransfusionnel,
    Commande,
    Don,
    Poche,
    RappelAction,
    RappelLot,
    Reservation,
    UserAccount,
)
from app.db.session import get_db
from app.schemas.hemovigilance import (
    ActeTransfusionnelOut,
    ActeTransfusionnelCreate,
    ImpactRappelOut,
    PartenaireFluxOut,
    PartenaireEventOut,
    RappelActionCreate,
    RappelActionOut,
    RappelAutoCreate,
    RappelCreate,
    RappelOut,
    RapportAutoriteOut,
    RappelLotStat,
    RappelStatutStat,
    TransfusionHopitalStat,
)

router = APIRouter(prefix="/hemovigilance")


def _now_utc():
    return dt.datetime.now(dt.timezone.utc)


def _log_rappel_action(
    db: Session,
    *,
    rappel: RappelLot,
    action: str,
    validateur_id: uuid.UUID | None,
    note: str | None,
) -> None:
    db.add(RappelAction(rappel_id=rappel.id, action=action, validateur_id=validateur_id, note=note))
    log_event(
        db,
        aggregate_type="rappel",
        aggregate_id=rappel.id,
        event_type=f"rappel.{action.lower()}",
        payload={
            "rappel_id": str(rappel.id),
            "action": action,
            "validateur_id": str(validateur_id) if validateur_id else None,
            "note": note,
        },
    )


def _poches_cibles(db: Session, rappel: RappelLot, *, lock: bool = False) -> list[Poche]:
    stmt = select(Poche).join(Don, Don.id == Poche.don_id)
    if rappel.type_cible == "DIN":
        stmt = stmt.where(Don.din == rappel.valeur_cible)
    elif rappel.type_cible == "LOT":
        stmt = stmt.where(Poche.lot == rappel.valeur_cible)
    else:
        raise HTTPException(status_code=409, detail="type_cible invalide")
    if lock:
        stmt = stmt.with_for_update()
    poches = list(db.execute(stmt).scalars())
    seen = {p.id for p in poches}
    frontier = set(seen)
    while frontier:
        children = list(db.execute(
            select(Poche).where(Poche.source_poche_id.in_(frontier))
        ).scalars())
        frontier = {p.id for p in children if p.id not in seen}
        poches.extend(p for p in children if p.id not in seen)
        seen.update(frontier)
    return poches


def _isoler_poches_rappellees(db: Session, rappel: RappelLot) -> None:
    """Isoler le stock et annuler les réservations des commandes affectées."""
    poches = _poches_cibles(db, rappel, lock=True)
    ids = [p.id for p in poches]
    commandes = set(
        db.execute(
            select(Reservation.commande_id).where(
                Reservation.poche_id.in_(ids), Reservation.released_at.is_(None)
            )
        ).scalars()
    ) if ids else set()

    now = _now_utc()
    if commandes:
        reservations = list(
            db.execute(
                select(Reservation).where(
                    Reservation.commande_id.in_(commandes), Reservation.released_at.is_(None)
                )
            ).scalars()
        )
        reserved_poches = {
            p.id: p for p in db.execute(
                select(Poche).where(Poche.id.in_([r.poche_id for r in reservations]))
            ).scalars()
        }
        recalled_ids = set(ids)
        for reservation in reservations:
            reservation.released_at = now
            poche = reserved_poches.get(reservation.poche_id)
            if poche and poche.id not in recalled_ids and poche.statut_distribution == "RESERVE":
                poche.statut_distribution = "DISPONIBLE"
                poche.statut_stock = "EN_STOCK"
                poche.emplacement_stock = "STOCK"
        for commande_id in commandes:
            commande = db.get(Commande, commande_id)
            if commande and commande.statut == "VALIDEE":
                commande.statut = "BROUILLON"
                log_event(db, aggregate_type="commande", aggregate_id=commande.id,
                          event_type="commande.reservations_annulees_rappel",
                          payload={"rappel_id": str(rappel.id)})

    for poche in poches:
        if poche.statut_distribution in {"DISPONIBLE", "RESERVE", "NON_DISTRIBUABLE"}:
            poche.statut_distribution = "NON_DISTRIBUABLE"
            poche.statut_stock = "RAPPELEE"
            poche.emplacement_stock = "QUARANTAINE"
            log_event(db, aggregate_type="poche", aggregate_id=poche.id,
                      event_type="poche.rappellee",
                      payload={"rappel_id": str(rappel.id), "poche_id": str(poche.id)})


def _compute_impacts(db: Session, *, rappel: RappelLot, limit: int) -> list[ImpactRappelOut]:
    ids = [p.id for p in _poches_cibles(db, rappel)]
    if not ids:
        return []
    latest_reservation = (
        select(Reservation.id)
        .where(Reservation.poche_id == Poche.id)
        .order_by(Reservation.date_reservation.desc(), Reservation.id.desc())
        .limit(1)
        .correlate(Poche)
        .scalar_subquery()
    )
    stmt = (
        select(
            Poche.id,
            Poche.don_id,
            Don.din,
            Poche.type_produit,
            Poche.lot,
            Poche.statut_distribution,
            ActeTransfusionnel.hopital_id,
            ActeTransfusionnel.receveur_id,
            ActeTransfusionnel.commande_id,
            ActeTransfusionnel.date_transfusion,
            Reservation.commande_id.label("commande_reservation_id"),
            Reservation.receveur_id.label("receveur_reservation_id"),
            Commande.hopital_id.label("hopital_reservation_id"),
        )
        .join(Don, Don.id == Poche.don_id)
        .where(Poche.id.in_(ids))
        .outerjoin(ActeTransfusionnel, ActeTransfusionnel.poche_id == Poche.id)
        .outerjoin(
            Reservation,
            Reservation.id == latest_reservation,
        )
        .outerjoin(Commande, Commande.id == Reservation.commande_id)
    )
    stmt = stmt.order_by(Poche.created_at.desc()).limit(limit)
    rows = list(db.execute(stmt).all())

    out: list[ImpactRappelOut] = []
    for (
        poche_id,
        don_id,
        din_value,
        type_produit,
        lot_value,
        statut_distribution,
        hopital_id,
        receveur_id,
        commande_id,
        date_transfusion,
        commande_reservation_id,
        receveur_reservation_id,
        hopital_reservation_id,
    ) in rows:
        out.append(
            ImpactRappelOut(
                poche_id=poche_id,
                don_id=don_id,
                din=din_value,
                type_produit=type_produit,
                lot=lot_value,
                statut_distribution=statut_distribution,
                hopital_id=hopital_id or hopital_reservation_id,
                receveur_id=receveur_id or receveur_reservation_id,
                commande_id=commande_id or commande_reservation_id,
                date_transfusion=date_transfusion,
            )
        )
    return out


@router.get("/transfusions", response_model=list[ActeTransfusionnelOut])
def list_transfusions(
    din: str | None = Query(default=None, max_length=32),
    lot: str | None = Query(default=None, max_length=32),
    receveur_id: uuid.UUID | None = Query(default=None),
    hopital_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=200, le=500),
    db: Session = Depends(get_db),
) -> list[ActeTransfusionnelOut]:
    stmt = (
        select(ActeTransfusionnel, Don.din, Poche.type_produit, Poche.lot)
        .join(Poche, Poche.id == ActeTransfusionnel.poche_id)
        .join(Don, Don.id == Poche.don_id)
    )
    if din is not None:
        stmt = stmt.where(Don.din == din)
    if lot is not None:
        stmt = stmt.where(Poche.lot == lot)
    if receveur_id is not None:
        stmt = stmt.where(ActeTransfusionnel.receveur_id == receveur_id)
    if hopital_id is not None:
        stmt = stmt.where(ActeTransfusionnel.hopital_id == hopital_id)
    stmt = stmt.order_by(ActeTransfusionnel.date_transfusion.desc()).limit(limit)

    rows = list(db.execute(stmt).all())
    out: list[ActeTransfusionnelOut] = []
    for acte, din_value, type_produit, lot_value in rows:
        item = ActeTransfusionnelOut.model_validate(acte)
        item.din = din_value
        item.type_produit = type_produit
        item.lot = lot_value
        out.append(item)
    return out


@router.post("/transfusions", response_model=ActeTransfusionnelOut, status_code=201)
def confirmer_transfusion(
    payload: ActeTransfusionnelCreate,
    db: Session = Depends(get_db),
    _user: UserAccount = Depends(require_staff),
) -> ActeTransfusionnelOut:
    """Confirmer l'administration réelle d'une poche déjà livrée."""
    if (_user.role or "").lower() not in {"admin", "medecin"}:
        raise HTTPException(status_code=403, detail="Confirmation réservée au médecin")
    poche = db.execute(
        select(Poche).where(Poche.id == payload.poche_id).with_for_update()
    ).scalar_one_or_none()
    if poche is None:
        raise HTTPException(status_code=404, detail="poche introuvable")
    if poche.statut_distribution != "DISTRIBUE":
        raise HTTPException(status_code=409, detail="poche non distribuée")
    if db.execute(select(ActeTransfusionnel.id).where(
        ActeTransfusionnel.poche_id == poche.id
    )).scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="transfusion déjà confirmée")
    reservation = db.execute(
        select(Reservation).join(Commande, Commande.id == Reservation.commande_id)
        .where(Reservation.poche_id == poche.id, Commande.statut == "SERVIE")
        .order_by(Reservation.date_reservation.desc()).limit(1)
    ).scalar_one_or_none()
    if reservation is None or reservation.receveur_id is None:
        raise HTTPException(status_code=409, detail="réservation ou receveur introuvable")
    commande = db.get(Commande, reservation.commande_id)
    if commande is None or commande.statut != "SERVIE":
        raise HTTPException(status_code=409, detail="commande non livrée")
    date_transfusion = payload.date_transfusion
    if date_transfusion.tzinfo is None:
        raise HTTPException(status_code=422, detail="Fuseau horaire requis")
    if date_transfusion > _now_utc():
        raise HTTPException(status_code=422, detail="Date de transfusion future")
    if reservation.released_at is not None:
        delivered_at = reservation.released_at
        if delivered_at.tzinfo is None:
            delivered_at = delivered_at.replace(tzinfo=dt.timezone.utc)
        if date_transfusion < delivered_at:
            raise HTTPException(status_code=422, detail="Transfusion antérieure à la livraison")
    acte = ActeTransfusionnel(
        poche_id=poche.id, commande_id=commande.id, hopital_id=commande.hopital_id,
        receveur_id=reservation.receveur_id, date_transfusion=date_transfusion,
        validateur_id=_user.id,
    )
    db.add(acte)
    db.flush()
    log_event(db, aggregate_type="poche", aggregate_id=poche.id,
              event_type="transfusion.confirmee",
              payload={"acte_id": str(acte.id), "commande_id": str(commande.id),
                       "receveur_id": str(reservation.receveur_id)})
    db.commit()
    db.refresh(acte)
    don = db.get(Don, poche.don_id)
    out = ActeTransfusionnelOut.model_validate(acte)
    out.din = don.din if don else None
    out.type_produit = poche.type_produit
    out.lot = poche.lot
    return out


@router.post("/rappels", response_model=RappelOut, status_code=201)
def create_rappel(
    payload: RappelCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> RappelLot:
    row = RappelLot(
        type_cible=payload.type_cible,
        valeur_cible=payload.valeur_cible,
        motif=payload.motif,
        statut="OUVERT",
    )
    db.add(row)
    db.flush()
    _isoler_poches_rappellees(db, row)
    _log_rappel_action(db, rappel=row, action="CREER", validateur_id=None, note=row.motif)
    db.commit()
    db.refresh(row)
    return row


@router.post("/rappels/auto", response_model=RappelOut)
def create_rappel_auto(
    payload: RappelAutoCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> RappelLot:
    existing = (
        db.execute(
            select(RappelLot)
            .where(
                RappelLot.type_cible == payload.type_cible,
                RappelLot.valeur_cible == payload.valeur_cible,
                RappelLot.statut != "CLOTURE",
            )
            .order_by(RappelLot.created_at.desc())
            .limit(1)
        )
        .scalars()
        .first()
    )
    if existing is not None:
        _isoler_poches_rappellees(db, existing)
        db.commit()
        return existing

    now = _now_utc()
    row = RappelLot(
        type_cible=payload.type_cible,
        valeur_cible=payload.valeur_cible,
        motif=payload.motif,
        statut="NOTIFIE",
        notified_at=now,
    )
    db.add(row)
    db.flush()
    _isoler_poches_rappellees(db, row)
    _log_rappel_action(db, rappel=row, action="CREER", validateur_id=None, note=payload.motif)
    _log_rappel_action(db, rappel=row, action="NOTIFIER", validateur_id=None, note=payload.source)
    db.commit()
    db.refresh(row)
    return row


@router.get("/rappels", response_model=list[RappelOut])
def list_rappels(
    statut: str | None = Query(default=None, max_length=16),
    limit: int = Query(default=200, le=500),
    db: Session = Depends(get_db),
) -> list[RappelLot]:
    stmt = select(RappelLot)
    if statut is not None:
        stmt = stmt.where(RappelLot.statut == statut)
    stmt = stmt.order_by(RappelLot.created_at.desc()).limit(limit)
    return list(db.execute(stmt).scalars())


@router.get("/rappels/{rappel_id}", response_model=RappelOut)
def get_rappel(rappel_id: uuid.UUID, db: Session = Depends(get_db)) -> RappelLot:
    row = db.get(RappelLot, rappel_id)
    if row is None:
        raise HTTPException(status_code=404, detail="rappel introuvable")
    return row


@router.get("/rappels/{rappel_id}/actions", response_model=list[RappelActionOut])
def list_rappel_actions(
    rappel_id: uuid.UUID,
    limit: int = Query(default=200, le=500),
    db: Session = Depends(get_db),
) -> list[RappelAction]:
    stmt = (
        select(RappelAction)
        .where(RappelAction.rappel_id == rappel_id)
        .order_by(RappelAction.created_at.desc())
        .limit(limit)
    )
    return list(db.execute(stmt).scalars())


@router.get("/rapports/autorites", response_model=RapportAutoriteOut)
def rapport_autorites(db: Session = Depends(get_db)) -> RapportAutoriteOut:
    rappels_rows = list(
        db.execute(select(RappelLot.statut, func.count()).group_by(RappelLot.statut)).all()
    )
    transfusions_rows = list(
        db.execute(
            select(ActeTransfusionnel.hopital_id, func.count()).group_by(
                ActeTransfusionnel.hopital_id
            )
        ).all()
    )
    rappels_lot_rows = list(db.execute(select(Poche.lot, func.count()).group_by(Poche.lot)).all())

    return RapportAutoriteOut(
        generated_at=_now_utc(),
        rappels_par_statut=[
            RappelStatutStat(statut=statut, total=total) for statut, total in rappels_rows
        ],
        transfusions_par_hopital=[
            TransfusionHopitalStat(hopital_id=hopital_id, total=total)
            for hopital_id, total in transfusions_rows
        ],
        rappels_par_lot=[RappelLotStat(lot=lot, total=total) for lot, total in rappels_lot_rows],
    )


@router.get("/partenaires/flux", response_model=PartenaireFluxOut)
def flux_partenaires(
    cursor: str | None = Query(default=None),
    hopital_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=200, ge=1, le=1000),
    db: Session = Depends(get_db),
) -> PartenaireFluxOut:
    stmt = (
        select(TraceEvent)
        .where(
            or_(
                TraceEvent.event_type.like("rappel.%"),
                TraceEvent.event_type.like("commande.%"),
                TraceEvent.event_type.like("reservation.%"),
                TraceEvent.event_type.like("notification.hopital.%"),
            )
        )
        .order_by(TraceEvent.created_at.asc(), TraceEvent.id.asc())
        .limit(limit)
    )

    if cursor:
        created_at, event_id = decode_cursor(cursor)
        stmt = stmt.where(
            or_(
                TraceEvent.created_at > created_at,
                (TraceEvent.created_at == created_at) & (TraceEvent.id > event_id),
            )
        )

    if hopital_id is not None:
        dialect = db.get_bind().dialect.name
        hopital_str = str(hopital_id)
        if dialect == "postgresql":
            stmt = stmt.where(TraceEvent.payload["hopital_id"].astext == hopital_str)  # type: ignore[attr-defined]
        else:
            stmt = stmt.where(
                cast(TraceEvent.payload, String).like(f'%"hopital_id": "{hopital_str}"%')
            )

    rows = list(db.execute(stmt).scalars())
    next_cursor = (
        encode_cursor(created_at=rows[-1].created_at, event_id=rows[-1].id) if rows else None
    )
    return PartenaireFluxOut(
        events=[PartenaireEventOut.model_validate(r) for r in rows], next_cursor=next_cursor
    )


@router.post("/rappels/{rappel_id}/notifier", response_model=RappelOut)
def notifier_rappel(
    rappel_id: uuid.UUID,
    payload: RappelActionCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> RappelLot:
    row = db.get(RappelLot, rappel_id)
    if row is None:
        raise HTTPException(status_code=404, detail="rappel introuvable")
    if row.statut == "CLOTURE":
        return row
    if row.statut in {"OUVERT", "NOTIFIE"}:
        if row.notified_at is None:
            row.notified_at = _now_utc()
        row.statut = "NOTIFIE"
        _log_rappel_action(
            db,
            rappel=row,
            action="NOTIFIER",
            validateur_id=payload.validateur_id,
            note=payload.note,
        )
        db.commit()
        db.refresh(row)
        return row
    raise HTTPException(status_code=409, detail="transition rappel interdite")


@router.post("/rappels/{rappel_id}/confirmer", response_model=RappelOut)
def confirmer_rappel(
    rappel_id: uuid.UUID,
    payload: RappelActionCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> RappelLot:
    row = db.get(RappelLot, rappel_id)
    if row is None:
        raise HTTPException(status_code=404, detail="rappel introuvable")
    if row.statut == "CLOTURE":
        return row
    if row.statut in {"NOTIFIE", "CONFIRME"}:
        if row.confirmed_at is None:
            row.confirmed_at = _now_utc()
        row.statut = "CONFIRME"
        _log_rappel_action(
            db,
            rappel=row,
            action="CONFIRMER",
            validateur_id=payload.validateur_id,
            note=payload.note,
        )
        db.commit()
        db.refresh(row)
        return row
    raise HTTPException(status_code=409, detail="transition rappel interdite")


@router.post("/rappels/{rappel_id}/cloturer", response_model=RappelOut)
def cloturer_rappel(
    rappel_id: uuid.UUID,
    payload: RappelActionCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> RappelLot:
    row = db.get(RappelLot, rappel_id)
    if row is None:
        raise HTTPException(status_code=404, detail="rappel introuvable")
    if row.statut == "CLOTURE":
        return row
    if row.statut in {"CONFIRME", "CLOTURE"}:
        if row.closed_at is None:
            row.closed_at = _now_utc()
        row.statut = "CLOTURE"
        _log_rappel_action(
            db,
            rappel=row,
            action="CLOTURER",
            validateur_id=payload.validateur_id,
            note=payload.note,
        )
        db.commit()
        db.refresh(row)
        return row
    raise HTTPException(status_code=409, detail="transition rappel interdite")


@router.get("/rappels/{rappel_id}/impacts", response_model=list[ImpactRappelOut])
def impacts_rappel(
    rappel_id: uuid.UUID,
    limit: int = Query(default=500, le=2000),
    db: Session = Depends(get_db),
) -> list[ImpactRappelOut]:
    rappel = db.get(RappelLot, rappel_id)
    if rappel is None:
        raise HTTPException(status_code=404, detail="rappel introuvable")
    return _compute_impacts(db, rappel=rappel, limit=limit)


@router.get("/rappels/{rappel_id}/export/hopitaux")
def export_impacts_hopitaux(
    rappel_id: uuid.UUID,
    format: str = Query(default="json", pattern="^(json|csv)$"),
    db: Session = Depends(get_db),
):
    rappel = db.get(RappelLot, rappel_id)
    if rappel is None:
        raise HTTPException(status_code=404, detail="rappel introuvable")
    impacts = _compute_impacts(db, rappel=rappel, limit=2000)
    agg: dict[str, dict] = {}
    for it in impacts:
        key = str(it.hopital_id) if it.hopital_id is not None else "NONE"
        row = agg.setdefault(
            key,
            {
                "hopital_id": it.hopital_id,
                "total": 0,
                "distribuees": 0,
                "reservees": 0,
                "autres": 0,
            },
        )
        row["total"] += 1
        if it.statut_distribution == "DISTRIBUE":
            row["distribuees"] += 1
        elif it.statut_distribution == "RESERVE":
            row["reservees"] += 1
        else:
            row["autres"] += 1

    rows = list(agg.values())
    rows.sort(key=lambda r: (r["hopital_id"] is None, str(r["hopital_id"])))

    if format == "json":
        return rows

    buf = io.StringIO()
    w = csv.DictWriter(
        buf, fieldnames=["hopital_id", "total", "distribuees", "reservees", "autres"]
    )
    w.writeheader()
    for r in rows:
        w.writerow(
            {
                "hopital_id": str(r["hopital_id"]) if r["hopital_id"] is not None else "",
                "total": r["total"],
                "distribuees": r["distribuees"],
                "reservees": r["reservees"],
                "autres": r["autres"],
            }
        )
    return PlainTextResponse(buf.getvalue(), media_type="text/csv")


@router.get("/rappels/{rappel_id}/export/receveurs")
def export_impacts_receveurs(
    rappel_id: uuid.UUID,
    format: str = Query(default="json", pattern="^(json|csv)$"),
    db: Session = Depends(get_db),
):
    rappel = db.get(RappelLot, rappel_id)
    if rappel is None:
        raise HTTPException(status_code=404, detail="rappel introuvable")
    impacts = _compute_impacts(db, rappel=rappel, limit=2000)
    agg: dict[str, dict] = {}
    for it in impacts:
        key = str(it.receveur_id) if it.receveur_id is not None else "NONE"
        row = agg.setdefault(
            key,
            {
                "receveur_id": it.receveur_id,
                "total": 0,
                "distribuees": 0,
                "reservees": 0,
                "autres": 0,
            },
        )
        row["total"] += 1
        if it.statut_distribution == "DISTRIBUE":
            row["distribuees"] += 1
        elif it.statut_distribution == "RESERVE":
            row["reservees"] += 1
        else:
            row["autres"] += 1

    rows = list(agg.values())
    rows.sort(key=lambda r: (r["receveur_id"] is None, str(r["receveur_id"])))

    if format == "json":
        return rows

    buf = io.StringIO()
    w = csv.DictWriter(
        buf, fieldnames=["receveur_id", "total", "distribuees", "reservees", "autres"]
    )
    w.writeheader()
    for r in rows:
        w.writerow(
            {
                "receveur_id": str(r["receveur_id"]) if r["receveur_id"] is not None else "",
                "total": r["total"],
                "distribuees": r["distribuees"],
                "reservees": r["reservees"],
                "autres": r["autres"],
            }
        )
    return PlainTextResponse(buf.getvalue(), media_type="text/csv")
