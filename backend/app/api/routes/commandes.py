import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import require_auth_in_production
from app.audit.events import TraceEvent, log_event
from app.core.blood import (
    is_compatible_plasma,
    normalize_groupe_sanguin,
    requires_abo_compatibility,
    requires_crossmatch,
)
from app.db.models import (
    ActeTransfusionnel,
    Commande,
    CrossMatch,
    Don,
    Hopital,
    LigneCommande,
    Poche,
    Receveur,
    Reservation,
    UserAccount,
)
from app.db.session import get_db
from app.schemas.commandes import (
    CommandeAffecterPayload,
    CommandeConfirmationPayload,
    CommandeCreate,
    CommandeOut,
    CommandeServirPayload,
    CommandeValiderOut,
    CommandeValiderPayload,
    ReservationOut,
)
from app.schemas.trace import TraceEventOut

router = APIRouter(prefix="/commandes")


def _now_utc() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def _release_expired_reservations(db: Session) -> int:
    now = _now_utc()
    stmt = (
        select(Reservation)
        .where(Reservation.released_at.is_(None), Reservation.expires_at.is_not(None), Reservation.expires_at < now)
        .limit(500)
    )
    rows = list(db.execute(stmt).scalars())
    if not rows:
        return 0

    pocket_ids = [r.poche_id for r in rows]
    pockets = list(db.execute(select(Poche).where(Poche.id.in_(pocket_ids))).scalars())
    pockets_by_id = {p.id: p for p in pockets}
    din_by_poche_id = dict(
        db.execute(select(Poche.id, Don.din).join(Don, Don.id == Poche.don_id).where(Poche.id.in_(pocket_ids))).all()
    )

    for r in rows:
        p = pockets_by_id.get(r.poche_id)
        if p and p.statut_distribution == "RESERVE":
            p.statut_distribution = "DISPONIBLE"
            p.statut_stock = "EN_STOCK"
            p.emplacement_stock = "STOCK"
            log_event(
                db,
                aggregate_type="poche",
                aggregate_id=p.id,
                event_type="reservation.expiree",
                payload={
                    "poche_id": str(p.id),
                    "commande_id": str(r.commande_id),
                    "din": din_by_poche_id.get(p.id),
                },
            )
        r.released_at = now

    db.commit()
    return len(rows)


def _reserve_one_poche(
    db: Session,
    *,
    type_produit: str,
    groupe_sanguin: str | None,
    commande_id: uuid.UUID,
    ligne_commande_id: uuid.UUID,
    expires_at: dt.datetime,
) -> Poche | None:
    stmt = (
        select(Poche)
        .join(Don, Don.id == Poche.don_id)
        .where(
            Poche.statut_distribution == "DISPONIBLE",
            Poche.statut_stock == "EN_STOCK",
            Poche.type_produit == type_produit,
            Don.statut_qualification == "LIBERE",
            Poche.date_peremption >= dt.date.today(),
        )
        .order_by(Poche.date_peremption.asc(), Poche.created_at.asc())
        .limit(1)
        .with_for_update(skip_locked=True)
    )
    if groupe_sanguin is not None:
        stmt = stmt.where(Poche.groupe_sanguin == normalize_groupe_sanguin(groupe_sanguin))

    poche = db.execute(stmt).scalar_one_or_none()
    if poche is None:
        return None

    poche.statut_distribution = "RESERVE"
    poche.statut_stock = "RESERVEE"
    poche.emplacement_stock = "RESERVATION"

    res = Reservation(
        poche_id=poche.id,
        commande_id=commande_id,
        ligne_commande_id=ligne_commande_id,
        expires_at=expires_at,
    )
    db.add(res)
    db.flush()
    return poche


@router.post("/reservations/sweep")
def sweep_reservations(db: Session = Depends(get_db)) -> dict:
    released = _release_expired_reservations(db)
    return {"released": released}


@router.post("", response_model=CommandeOut, status_code=201)
def create_commande(
    payload: CommandeCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Commande:
    hopital = db.get(Hopital, payload.hopital_id)
    if hopital is None:
        raise HTTPException(status_code=404, detail="hôpital introuvable")
    if not hopital.convention_actif:
        raise HTTPException(status_code=409, detail="convention inactive")

    row = Commande(
        hopital_id=payload.hopital_id,
        statut="BROUILLON",
        date_livraison_prevue=payload.date_livraison_prevue,
    )
    db.add(row)
    db.flush()

    for l in payload.lignes:
        db.add(
            LigneCommande(
                commande_id=row.id,
                type_produit=l.type_produit,
                groupe_sanguin=normalize_groupe_sanguin(l.groupe_sanguin) if l.groupe_sanguin else None,
                quantite=l.quantite,
            )
        )

    db.commit()
    db.refresh(row)
    row = db.execute(select(Commande).where(Commande.id == row.id).options(selectinload(Commande.lignes))).scalar_one()
    log_event(
        db,
        aggregate_type="commande",
        aggregate_id=row.id,
        event_type="commande.creee",
        payload={
            "commande_id": str(row.id),
            "hopital_id": str(row.hopital_id),
            "lignes": [
                {
                    "type_produit": l.type_produit,
                    "groupe_sanguin": l.groupe_sanguin,
                    "quantite": l.quantite,
                }
                for l in row.lignes
            ],
        },
    )
    db.commit()
    return row


@router.get("", response_model=list[CommandeOut])
def list_commandes(
    statut: str | None = Query(default=None),
    hopital_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=100, le=500),
    db: Session = Depends(get_db),
) -> list[Commande]:
    stmt = select(Commande).options(selectinload(Commande.lignes))
    if statut is not None:
        stmt = stmt.where(Commande.statut == statut)
    if hopital_id is not None:
        stmt = stmt.where(Commande.hopital_id == hopital_id)
    stmt = stmt.order_by(Commande.created_at.desc()).limit(limit)
    return list(db.execute(stmt).scalars())


@router.get("/{commande_id}", response_model=CommandeOut)
def get_commande(commande_id: uuid.UUID, db: Session = Depends(get_db)) -> Commande:
    row = db.execute(
        select(Commande).where(Commande.id == commande_id).options(selectinload(Commande.lignes))
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="commande introuvable")
    return row


@router.get("/{commande_id}/events", response_model=list[TraceEventOut])
def list_commande_events(
    commande_id: uuid.UUID,
    after: dt.datetime | None = Query(default=None),
    event_type: str | None = Query(default=None, max_length=64),
    limit: int = Query(default=200, le=1000),
    db: Session = Depends(get_db),
) -> list[TraceEvent]:
    stmt = (
        select(TraceEvent)
        .where(TraceEvent.aggregate_type == "commande", TraceEvent.aggregate_id == commande_id)
        .order_by(TraceEvent.created_at.desc())
        .limit(limit)
    )
    if after is not None:
        stmt = stmt.where(TraceEvent.created_at > after)
        stmt = stmt.order_by(TraceEvent.created_at.asc())
    if event_type is not None:
        stmt = stmt.where(TraceEvent.event_type == event_type)
    return list(db.execute(stmt).scalars())


@router.post("/{commande_id}/valider", response_model=CommandeValiderOut)
def valider_commande(
    commande_id: uuid.UUID,
    payload: CommandeValiderPayload,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> CommandeValiderOut:
    _release_expired_reservations(db)

    commande = db.execute(
        select(Commande).where(Commande.id == commande_id).options(selectinload(Commande.lignes))
    ).scalar_one_or_none()
    if commande is None:
        raise HTTPException(status_code=404, detail="commande introuvable")
    if commande.statut != "BROUILLON":
        raise HTTPException(status_code=409, detail="commande non modifiable")

    now = _now_utc()
    expires_at = now + dt.timedelta(hours=payload.duree_reservation_heures)

    reserved: list[Poche] = []
    try:
        for ligne in commande.lignes:
            for _ in range(ligne.quantite):
                p = _reserve_one_poche(
                    db,
                    type_produit=ligne.type_produit,
                    groupe_sanguin=ligne.groupe_sanguin,
                    commande_id=commande.id,
                    ligne_commande_id=ligne.id,
                    expires_at=expires_at,
                )
                if p is None:
                    raise HTTPException(
                        status_code=409,
                        detail=f"stock insuffisant pour {ligne.type_produit} ({ligne.groupe_sanguin or 'tout'})",
                    )
                reserved.append(p)

        commande.statut = "VALIDEE"
        db.commit()
    except HTTPException:
        db.rollback()
        raise

    rows = list(
        db.execute(
            select(Reservation, Poche)
            .join(Poche, Poche.id == Reservation.poche_id)
            .where(Reservation.commande_id == commande.id, Reservation.released_at.is_(None))
            .order_by(Poche.date_peremption.asc(), Poche.created_at.asc())
        ).all()
    )
    dins = list(
        dict.fromkeys(
            [
                din
                for (din,) in db.execute(
                    select(Don.din)
                    .join(Poche, Poche.don_id == Don.id)
                    .where(Poche.id.in_([p.id for _, p in rows]))
                ).all()
            ]
        )
    )

    log_event(
        db,
        aggregate_type="commande",
        aggregate_id=commande.id,
        event_type="commande.validee",
        payload={
            "commande_id": str(commande.id),
            "reservations": [str(r.poche_id) for r, _ in rows],
            "dins": dins,
        },
    )
    log_event(
        db,
        aggregate_type="commande",
        aggregate_id=commande.id,
        event_type="notification.hopital.poches_disponibles",
        payload={
            "commande_id": str(commande.id),
            "hopital_id": str(commande.hopital_id),
            "poches_reservees": [str(r.poche_id) for r, _ in rows],
            "dins": dins,
        },
    )
    db.commit()

    return CommandeValiderOut(
        commande_id=commande.id,
        statut=commande.statut,
        reservations=[
            ReservationOut(
                poche_id=p.id,
                type_produit=p.type_produit,
                groupe_sanguin=p.groupe_sanguin,
                date_peremption=p.date_peremption,
                ligne_commande_id=r.ligne_commande_id,
                receveur_id=r.receveur_id,
            )
            for r, p in rows
        ],
    )


@router.post("/{commande_id}/affecter")
def affecter_receveurs(
    commande_id: uuid.UUID,
    payload: CommandeAffecterPayload,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> dict:
    commande = db.execute(
        select(Commande).where(Commande.id == commande_id).options(selectinload(Commande.lignes))
    ).scalar_one_or_none()
    if commande is None:
        raise HTTPException(status_code=404, detail="commande introuvable")
    if commande.statut not in {"VALIDEE"}:
        raise HTTPException(status_code=409, detail="commande non affectable")

    lignes_by_id = {l.id: l for l in commande.lignes}
    for a in payload.affectations:
        if a.ligne_commande_id not in lignes_by_id:
            raise HTTPException(status_code=404, detail="ligne commande introuvable")
        if db.get(Receveur, a.receveur_id) is None:
            raise HTTPException(status_code=404, detail="receveur introuvable")

    totals: dict[uuid.UUID, int] = {}
    for a in payload.affectations:
        totals[a.ligne_commande_id] = totals.get(a.ligne_commande_id, 0) + a.quantite
    for line_id, total in totals.items():
        if total != lignes_by_id[line_id].quantite:
            raise HTTPException(status_code=409, detail="quantités affectées incohérentes vs ligne")

    unassigned = list(
        db.execute(
            select(Reservation, Poche)
            .join(Poche, Poche.id == Reservation.poche_id)
            .where(
                Reservation.commande_id == commande.id,
                Reservation.released_at.is_(None),
                Reservation.receveur_id.is_(None),
                Poche.statut_distribution == "RESERVE",
            )
            .order_by(Poche.date_peremption.asc(), Poche.created_at.asc())
        ).all()
    )
    by_line: dict[uuid.UUID, list[Reservation]] = {}
    for r, p in unassigned:
        if r.ligne_commande_id is None:
            continue
        by_line.setdefault(r.ligne_commande_id, []).append(r)

    assigned = 0
    for a in payload.affectations:
        bucket = by_line.get(a.ligne_commande_id, [])
        if len(bucket) < a.quantite:
            raise HTTPException(status_code=409, detail="poches réservées insuffisantes pour affectation")
        for _ in range(a.quantite):
            r = bucket.pop(0)
            r.receveur_id = a.receveur_id
            assigned += 1

    db.commit()
    log_event(
        db,
        aggregate_type="commande",
        aggregate_id=commande.id,
        event_type="commande.affectee",
        payload={
            "commande_id": str(commande.id),
            "affectations": [a.model_dump(mode="json") for a in payload.affectations],
        },
    )
    db.commit()
    return {"commande_id": str(commande.id), "assigned": assigned}


@router.post("/{commande_id}/confirmer")
def confirmer_reservation(
    commande_id: uuid.UUID,
    payload: CommandeConfirmationPayload,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> dict:
    commande = db.get(Commande, commande_id)
    if commande is None:
        raise HTTPException(status_code=404, detail="commande introuvable")
    if commande.statut != "VALIDEE":
        raise HTTPException(status_code=409, detail="commande non confirmable")

    log_event(
        db,
        aggregate_type="commande",
        aggregate_id=commande.id,
        event_type="reservation.confirmee",
        payload={
            "commande_id": str(commande.id),
            "hopital_id": str(commande.hopital_id),
            "validateur_id": str(payload.validateur_id) if payload.validateur_id else None,
            "note": payload.note,
        },
    )
    db.commit()
    return {"commande_id": str(commande.id), "statut": commande.statut}


@router.post("/{commande_id}/annuler")
def annuler_commande(
    commande_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> dict:
    commande = db.get(Commande, commande_id)
    if commande is None:
        raise HTTPException(status_code=404, detail="commande introuvable")
    if commande.statut == "SERVIE":
        raise HTTPException(status_code=409, detail="commande déjà servie")
    if commande.statut == "ANNULEE":
        return {"commande_id": str(commande.id), "statut": commande.statut}

    now = _now_utc()
    rows = list(
        db.execute(
            select(Reservation).where(Reservation.commande_id == commande.id, Reservation.released_at.is_(None))
        ).scalars()
    )
    pocket_ids = [r.poche_id for r in rows]
    pockets = list(db.execute(select(Poche).where(Poche.id.in_(pocket_ids))).scalars())
    pockets_by_id = {p.id: p for p in pockets}
    din_by_poche_id = dict(
        db.execute(select(Poche.id, Don.din).join(Don, Don.id == Poche.don_id).where(Poche.id.in_(pocket_ids))).all()
    )

    for r in rows:
        p = pockets_by_id.get(r.poche_id)
        if p and p.statut_distribution == "RESERVE":
            p.statut_distribution = "DISPONIBLE"
            p.statut_stock = "EN_STOCK"
            p.emplacement_stock = "STOCK"
        r.released_at = now

    commande.statut = "ANNULEE"
    db.commit()

    log_event(
        db,
        aggregate_type="commande",
        aggregate_id=commande.id,
        event_type="commande.annulee",
        payload={
            "commande_id": str(commande.id),
            "reservations_releases": [
                {"poche_id": str(r.poche_id), "din": din_by_poche_id.get(r.poche_id)} for r in rows
            ],
        },
    )
    db.commit()
    return {"commande_id": str(commande.id), "statut": commande.statut}


@router.post("/{commande_id}/servir")
def servir_commande(
    commande_id: uuid.UUID,
    payload: CommandeServirPayload,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> dict:
    _release_expired_reservations(db)

    commande = db.get(Commande, commande_id)
    if commande is None:
        raise HTTPException(status_code=404, detail="commande introuvable")
    if commande.statut != "VALIDEE":
        raise HTTPException(status_code=409, detail="commande non servable")

    reservations = list(
        db.execute(
            select(Reservation).where(Reservation.commande_id == commande.id, Reservation.released_at.is_(None))
        ).scalars()
    )
    if not reservations:
        raise HTTPException(status_code=409, detail="aucune poche réservée")

    pocket_ids = [r.poche_id for r in reservations]
    poches = list(db.execute(select(Poche).where(Poche.id.in_(pocket_ids))).scalars())
    poches_by_id = {p.id: p for p in poches}

    receveur_ids = {r.receveur_id for r in reservations if r.receveur_id is not None}
    receveurs = list(db.execute(select(Receveur).where(Receveur.id.in_(list(receveur_ids)))).scalars())
    receveurs_by_id = {r.id: r for r in receveurs}

    for r in reservations:
        p = poches_by_id.get(r.poche_id)
        if p is None:
            raise HTTPException(status_code=409, detail="poche réservée introuvable")
        if p.statut_distribution != "RESERVE":
            raise HTTPException(status_code=409, detail="poche non réservée")

        if p.date_peremption < dt.date.today():
            raise HTTPException(status_code=409, detail="poche périmée")

        if r.receveur_id is None:
            raise HTTPException(status_code=409, detail="receveur manquant pour une poche réservée")
        receveur = receveurs_by_id.get(r.receveur_id)
        if receveur is None:
            raise HTTPException(status_code=409, detail="receveur introuvable pour une poche réservée")

        if requires_abo_compatibility(type_produit=p.type_produit):
            if p.groupe_sanguin is None or receveur.groupe_sanguin is None:
                raise HTTPException(status_code=409, detail="groupe sanguin manquant")
            if p.type_produit == "CGR":
                pass
            else:
                if not is_compatible_plasma(receveur=receveur.groupe_sanguin, donneur=p.groupe_sanguin):
                    raise HTTPException(status_code=409, detail="incompatibilité ABO produit ↔ receveur")

        if requires_crossmatch(type_produit=p.type_produit):
            cm = db.execute(
                select(CrossMatch).where(
                    CrossMatch.poche_id == p.id,
                    CrossMatch.receveur_id == r.receveur_id,
                    CrossMatch.resultat == "COMPATIBLE",
                )
            ).scalar_one_or_none()
            if cm is None:
                raise HTTPException(status_code=409, detail="cross-match compatible manquant")

        don_statut = db.execute(select(Don.statut_qualification).where(Don.id == p.don_id)).scalar_one_or_none()
        if don_statut != "LIBERE":
            raise HTTPException(status_code=409, detail="don non libéré")

    now = _now_utc()
    for r in reservations:
        p = poches_by_id[r.poche_id]
        p.statut_distribution = "DISTRIBUE"
        p.statut_stock = "DISTRIBUEE"
        p.emplacement_stock = "SORTIE"
        r.released_at = now
        db.add(
            ActeTransfusionnel(
                poche_id=p.id,
                commande_id=commande.id,
                hopital_id=commande.hopital_id,
                receveur_id=r.receveur_id,
                date_transfusion=now,
            )
        )

    commande.statut = "SERVIE"
    db.commit()

    din_by_poche_id = dict(
        db.execute(
            select(Poche.id, Don.din)
            .join(Don, Don.id == Poche.don_id)
            .where(Poche.id.in_([r.poche_id for r in reservations]))
        ).all()
    )
    log_event(
        db,
        aggregate_type="commande",
        aggregate_id=commande.id,
        event_type="commande.servie",
        payload={
            "commande_id": str(commande.id),
            "poches": [
                {
                    "poche_id": str(r.poche_id),
                    "receveur_id": str(r.receveur_id),
                    "din": din_by_poche_id.get(r.poche_id),
                }
                for r in reservations
            ],
        },
    )
    db.commit()

    return {
        "commande_id": str(commande.id),
        "statut": commande.statut,
        "poches": [{"poche_id": str(r.poche_id), "receveur_id": str(r.receveur_id)} for r in reservations],
    }
