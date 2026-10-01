import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.core.blood import normalize_groupe_sanguin
from app.core.recalls import hors_rappel_actif, poche_sous_rappel
from app.core.isbt128.generator import generate_datamatrix_content
from app.db.models import Don, Hopital, Poche, ProcedureApherese, UserAccount
from app.db.session import get_db
from app.schemas.etiquettes import EtiquetteProduitOut
from app.schemas.poches import (
    PocheCreate,
    PocheDestructionIn,
    PocheOut,
    PochePeremptionAlert,
    PocheUpdate,
    StockSummary,
)

router = APIRouter(prefix="/poches")


def _notify_hopitaux_poche_disponible(db: Session, *, poche: Poche, din: str | None) -> None:
    hopitaux = list(db.execute(select(Hopital).where(Hopital.convention_actif.is_(True))).scalars())
    for hopital in hopitaux:
        log_event(
            db,
            aggregate_type="hopital",
            aggregate_id=hopital.id,
            event_type="notification.hopital.poches_disponibles",
            payload={
                "hopital_id": str(hopital.id),
                "poche_id": str(poche.id),
                "din": din,
                "type_produit": poche.type_produit,
                "groupe_sanguin": poche.groupe_sanguin,
                "date_peremption": poche.date_peremption.isoformat()
                if poche.date_peremption
                else None,
            },
        )


@router.get("/disponibles", response_model=list[PocheOut])
def list_poches_disponibles(
    type_produit: str | None = Query(default=None),
    groupe_sanguin: str | None = Query(default=None, max_length=8),
    limit: int = Query(default=200, le=500),
    db: Session = Depends(get_db),
) -> list[Poche]:
    stmt = (
        select(Poche).join(Don, Don.id == Poche.don_id)
        .where(Poche.statut_distribution == "DISPONIBLE",
               Poche.statut_stock == "EN_STOCK",
               Poche.date_peremption >= dt.date.today(),
               Don.statut_qualification == "LIBERE", hors_rappel_actif())
    )
    if type_produit is not None:
        stmt = stmt.where(Poche.type_produit == type_produit)
    if groupe_sanguin is not None:
        stmt = stmt.where(Poche.groupe_sanguin == normalize_groupe_sanguin(groupe_sanguin))
    stmt = stmt.order_by(Poche.date_peremption.asc(), Poche.created_at.asc()).limit(limit)
    return list(db.execute(stmt).scalars())


@router.post("", response_model=PocheOut, status_code=201)
def create_poche(
    payload: PocheCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Poche:
    """
    Créer une nouvelle poche (produit dérivé du fractionnement).

    Types de produits:
    - ST: Sang Total
    - CGR: Concentré de Globules Rouges
    - PFC: Plasma Frais Congelé
    - CP: Concentré Plaquettaire
    """
    # Vérifier que le don existe
    don = db.get(Don, payload.don_id)
    if don is None:
        raise HTTPException(status_code=404, detail="don not found")
    source = None
    if don.type_don == "SANG_TOTAL":
        if payload.type_produit == "ST":
            raise HTTPException(status_code=409, detail="Une poche ST existe déjà pour ce don")
        source = db.execute(
            select(Poche).where(Poche.don_id == don.id, Poche.type_produit == "ST")
            .order_by(Poche.created_at.asc()).limit(1).with_for_update()
        ).scalar_one_or_none()
        if source is None:
            raise HTTPException(status_code=409, detail="Poche source ST introuvable")
        if source.statut_stock not in {"EN_STOCK", "FRACTIONNEE"} or poche_sous_rappel(db, source):
            raise HTTPException(status_code=409, detail="Poche source indisponible ou rappelée")
    if payload.date_peremption < dt.date.today():
        raise HTTPException(status_code=422, detail="Produit déjà périmé")
    if don.type_don in {"PLASMAPHERESE", "CYTAPHERESE"}:
        procedure = db.execute(
            select(ProcedureApherese).where(ProcedureApherese.don_id == don.id)
        ).scalar_one_or_none()
        if procedure is None or procedure.statut != "TERMINE":
            raise HTTPException(status_code=409, detail="Procédure d'aphérèse non terminée")
        allowed = {"PFC"} if don.type_don == "PLASMAPHERESE" else {"CGR", "CP"}
        if payload.type_produit not in allowed:
            raise HTTPException(status_code=422, detail="Produit incohérent avec le type d'aphérèse")
        if payload.volume_ml is None:
            raise HTTPException(status_code=422, detail="Volume réel du produit d'aphérèse requis")

    poche = Poche(
        don_id=payload.don_id,
        source_poche_id=source.id if source else None,
        type_produit=payload.type_produit,
        groupe_sanguin=source.groupe_sanguin if source else None,
        lot=source.lot if source else None,
        volume_ml=payload.volume_ml,
        date_peremption=payload.date_peremption,
        emplacement_stock=payload.emplacement_stock,
        statut_distribution="NON_DISTRIBUABLE",
    )
    related = list(db.execute(select(Poche).where(Poche.don_id == don.id)).scalars())
    sibling_recalled = any(poche_sous_rappel(db, other) for other in related)
    if source is not None:
        source.statut_stock = "FRACTIONNEE"
        source.statut_distribution = "NON_DISTRIBUABLE"
        source.emplacement_stock = "FRACTIONNEMENT"
    db.add(poche)
    db.flush()
    if sibling_recalled or poche_sous_rappel(db, poche):
        poche.statut_stock = "RAPPELEE"
        poche.emplacement_stock = "QUARANTAINE"
    log_event(db, aggregate_type="poche", aggregate_id=poche.id,
              event_type="poche.creee",
              payload={"don_id": str(don.id), "source_poche_id": str(source.id) if source else None,
                       "type_produit": poche.type_produit,
                       "acteur_id": str(_user.id) if _user else None})
    db.commit()
    db.refresh(poche)
    return poche


@router.get("", response_model=list[PocheOut])
def list_poches(
    type_produit: str | None = Query(default=None),
    statut_distribution: str | None = Query(default=None),
    emplacement_stock: str | None = Query(default=None),
    sort_by_expiration: bool = Query(
        default=False,
        description="Trier par date de péremption (FEFO: First Expired First Out)",
    ),
    limit: int = Query(default=100, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[Poche]:
    """
    Lister les poches avec filtres optionnels.

    Supporte le tri FEFO (First Expired First Out) pour la gestion de stock.
    """
    stmt = select(Poche)

    if type_produit is not None:
        stmt = stmt.where(Poche.type_produit == type_produit)
    if statut_distribution is not None:
        stmt = stmt.where(Poche.statut_distribution == statut_distribution)
    if emplacement_stock is not None:
        stmt = stmt.where(Poche.emplacement_stock == emplacement_stock)

    if sort_by_expiration:
        # FEFO: trier par date de péremption croissante
        stmt = stmt.order_by(Poche.date_peremption.asc(), Poche.created_at.asc())
    else:
        stmt = stmt.order_by(Poche.created_at.desc())

    stmt = stmt.limit(limit).offset(offset)
    return list(db.execute(stmt).scalars())


@router.get("/stock/summary", response_model=list[StockSummary])
def stock_summary(db: Session = Depends(get_db)) -> list[StockSummary]:
    """
    Obtenir un résumé du stock par type de produit.

    Compte les poches DISPONIBLE et RESERVE uniquement.
    """
    stmt = (
        select(
            Poche.type_produit,
            func.count(Poche.id).label("total"),
            func.sum(case((Poche.statut_distribution == "DISPONIBLE", 1), else_=0)).label(
                "disponible"
            ),
            func.sum(case((Poche.statut_distribution == "RESERVE", 1), else_=0)).label("reservee"),
        )
        .where(Poche.statut_distribution.in_(["DISPONIBLE", "RESERVE"]))
        .group_by(Poche.type_produit)
    )

    results = db.execute(stmt).all()

    return [
        StockSummary(
            type_produit=row.type_produit,
            quantite_disponible=int(row.disponible or 0),
            quantite_reservee=int(row.reservee or 0),
            quantite_totale=int(row.total or 0),
        )
        for row in results
    ]


@router.get("/alertes/peremption", response_model=list[PochePeremptionAlert])
def alertes_peremption(
    jours: int = Query(
        default=7,
        ge=1,
        le=90,
        description="Nombre de jours avant péremption pour déclencher l'alerte",
    ),
    type_produit: str | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[PochePeremptionAlert]:
    """
    Obtenir les poches qui périment bientôt.

    Alerte sur les poches DISPONIBLE ou RESERVE qui périment dans N jours.
    DEVBOOK.md: Chaîne du froid - alertes de péremption.
    """
    date_limite = dt.date.today() + dt.timedelta(days=jours)

    stmt = (
        select(Poche)
        .options(joinedload(Poche.don))
        .where(
            Poche.date_peremption <= date_limite,
            Poche.statut_distribution.in_(["DISPONIBLE", "RESERVE"]),
        )
    )

    if type_produit is not None:
        stmt = stmt.where(Poche.type_produit == type_produit)

    stmt = stmt.order_by(Poche.date_peremption.asc())

    poches = db.execute(stmt).scalars().all()

    today = dt.date.today()
    return [
        PochePeremptionAlert(
            id=p.id,
            don_id=p.don_id,
            din=p.don.din,
            type_produit=p.type_produit,
            date_peremption=p.date_peremption,
            jours_restants=(p.date_peremption - today).days,
            emplacement_stock=p.emplacement_stock,
            statut_distribution=p.statut_distribution,
        )
        for p in poches
    ]


@router.get("/{poche_id}", response_model=PocheOut)
def get_poche(poche_id: uuid.UUID, db: Session = Depends(get_db)) -> Poche:
    """Récupérer une poche par son ID."""
    poche = db.get(Poche, poche_id)
    if poche is None:
        raise HTTPException(status_code=404, detail="poche not found")
    return poche


@router.get("/{poche_id}/etiquette-produit", response_model=EtiquetteProduitOut)
def etiquette_produit(poche_id: uuid.UUID, db: Session = Depends(get_db)) -> EtiquetteProduitOut:
    row = db.execute(
        select(Poche, Don.din, Don.date_don)
        .join(Don, Don.id == Poche.don_id)
        .where(Poche.id == poche_id)
    ).first()
    if row is None:
        raise HTTPException(status_code=404, detail="poche not found")

    poche, din, date_don = row

    # Génération du contenu DataMatrix ISBT 128
    datamatrix_content = generate_datamatrix_content(
        din=din,
        product_code=poche.code_produit_isbt or "",
        expiration_date=poche.date_peremption,
        blood_group=poche.groupe_sanguin,
        collection_date=date_don,
    )

    payload = {
        "din": din,
        "product_code": poche.code_produit_isbt,
        "lot": poche.lot,
        "division": poche.division,
        "collection_date": date_don.isoformat(),
        "expiration_date": poche.date_peremption.isoformat(),
        "blood_group": poche.groupe_sanguin,
        "type_produit": poche.type_produit,
        "statut_stock": poche.statut_stock,
        "statut_distribution": poche.statut_distribution,
        "datamatrix_content": datamatrix_content,
    }

    return EtiquetteProduitOut(
        poche_id=poche.id,
        don_id=poche.don_id,
        din=din,
        type_produit=poche.type_produit,
        code_produit_isbt=poche.code_produit_isbt,
        lot=poche.lot,
        division=poche.division,
        date_prelevement=date_don,
        date_peremption=poche.date_peremption,
        groupe_sanguin=poche.groupe_sanguin,
        statut_stock=poche.statut_stock,
        statut_distribution=poche.statut_distribution,
        payload=payload,
    )


@router.patch("/{poche_id}", response_model=PocheOut)
def update_poche(
    poche_id: uuid.UUID,
    payload: PocheUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Poche:
    """
    Mettre à jour une poche.

    ATTENTION: Le changement de statut vers DISPONIBLE doit normalement
    passer par l'endpoint de libération biologique.
    """
    poche = db.execute(
        select(Poche).where(Poche.id == poche_id).with_for_update()
    ).scalar_one_or_none()
    if poche is None:
        raise HTTPException(status_code=404, detail="poche not found")
    if poche.statut_distribution in {"RESERVE", "DISTRIBUE"} and (
        payload.groupe_sanguin is not None or payload.lot is not None
        or payload.code_produit_isbt is not None or payload.division is not None
    ):
        raise HTTPException(status_code=409, detail="Identité d'une poche réservée ou distribuée non modifiable")

    if payload.emplacement_stock is not None:
        poche.emplacement_stock = payload.emplacement_stock

    if payload.groupe_sanguin is not None:
        don = db.get(Don, poche.don_id)
        if don is not None and don.statut_qualification == "LIBERE":
            raise HTTPException(status_code=409, detail="Groupe sanguin figé après libération biologique")
        poche.groupe_sanguin = normalize_groupe_sanguin(payload.groupe_sanguin)

    if payload.code_produit_isbt is not None:
        poche.code_produit_isbt = payload.code_produit_isbt.strip() or None
    if payload.lot is not None:
        new_lot = payload.lot.strip() or None
        don = db.get(Don, poche.don_id)
        if new_lot != poche.lot and (
            poche.statut_stock == "RAPPELEE"
            or (don is not None and don.statut_qualification == "LIBERE" and poche.lot)
        ):
            raise HTTPException(status_code=409, detail="Lot figé après libération ou rappel")
        poche.lot = new_lot
        db.flush()
        if poche_sous_rappel(db, poche):
            poche.statut_distribution = "NON_DISTRIBUABLE"
            poche.statut_stock = "RAPPELEE"
            poche.emplacement_stock = "QUARANTAINE"
    if payload.division is not None:
        poche.division = payload.division

    previous_status = poche.statut_distribution
    if payload.statut_distribution is not None:
        if previous_status in {"RESERVE", "DISTRIBUE"}:
            raise HTTPException(status_code=409, detail="Statut contrôlé par le workflow de distribution")
        if payload.statut_distribution in {"RESERVE", "DISTRIBUE"}:
            raise HTTPException(
                status_code=422,
                detail="Utiliser le workflow commandes (réservation/distribution)",
            )
        # Validation: ne pas permettre DISPONIBLE si le don n'est pas LIBERE
        don = None
        if payload.statut_distribution == "DISPONIBLE":
            don = db.get(Don, poche.don_id)
            if don is None or don.statut_qualification != "LIBERE":
                raise HTTPException(
                    status_code=422,
                    detail="Impossible de rendre une poche DISPONIBLE si le don n'est pas LIBERE",
                )
            if poche_sous_rappel(db, poche):
                raise HTTPException(status_code=409, detail="Poche sous rappel actif")
            if db.execute(select(Poche.id).where(
                Poche.source_poche_id == poche.id
            )).scalar_one_or_none() is not None:
                raise HTTPException(status_code=409, detail="Poche source déjà fractionnée")
            if poche.date_peremption < dt.date.today():
                raise HTTPException(status_code=409, detail="Poche périmée")
            if poche.statut_stock not in {"EN_STOCK", "RAPPELEE"}:
                raise HTTPException(status_code=409, detail="Poche hors du stock distribuable")
            if poche.statut_stock == "RAPPELEE":
                poche.statut_stock = "EN_STOCK"
                poche.emplacement_stock = "STOCK"
        poche.statut_distribution = payload.statut_distribution
        if payload.statut_distribution == "DISPONIBLE" and previous_status != "DISPONIBLE":
            din = don.din if don else None
            log_event(
                db,
                aggregate_type="poche",
                aggregate_id=poche.id,
                event_type="poche.disponible",
                payload={
                    "poche_id": str(poche.id),
                    "din": din,
                    "type_produit": poche.type_produit,
                    "groupe_sanguin": poche.groupe_sanguin,
                },
            )
            _notify_hopitaux_poche_disponible(db, poche=poche, din=din)

    if payload.model_fields_set:
        log_event(db, aggregate_type="poche", aggregate_id=poche.id,
                  event_type="poche.modifiee",
                  payload={"champs": sorted(payload.model_fields_set),
                           "acteur_id": str(_user.id) if _user else None})
    db.commit()
    db.refresh(poche)
    return poche


@router.delete("/{poche_id}", status_code=204)
def delete_poche(
    poche_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> None:
    """Suppression physique interdite : elle romprait la traçabilité veine-à-veine."""
    if db.get(Poche, poche_id) is None:
        raise HTTPException(status_code=404, detail="poche not found")
    raise HTTPException(
        status_code=409,
        detail="Suppression interdite (traçabilité) : utilisez la mise au rebut (POST /poches/{id}/detruire)",
    )


# Statuts depuis lesquels une poche peut être détruite.
STATUTS_DESTRUCTIBLES = {"EN_STOCK", "RAPPELEE"}


@router.post("/{poche_id}/detruire", response_model=PocheOut)
def detruire_poche(
    poche_id: uuid.UUID,
    payload: PocheDestructionIn,
    db: Session = Depends(get_db),
    user: UserAccount | None = Depends(require_auth_in_production),
) -> Poche:
    """Mise au rebut tracée : la poche reste en base, statut DETRUITE."""
    poche = db.execute(select(Poche).where(Poche.id == poche_id).with_for_update()).scalar_one_or_none()
    if poche is None:
        raise HTTPException(status_code=404, detail="poche not found")
    if poche.statut_stock not in STATUTS_DESTRUCTIBLES:
        raise HTTPException(
            status_code=409,
            detail=f"poche non destructible depuis le statut {poche.statut_stock}",
        )
    if poche.statut_distribution == "RESERVE":
        raise HTTPException(
            status_code=409, detail="poche réservée : annulez d'abord la commande correspondante"
        )

    previous = {"statut_stock": poche.statut_stock, "statut_distribution": poche.statut_distribution}
    poche.statut_stock = "DETRUITE"
    poche.statut_distribution = "NON_DISTRIBUABLE"
    poche.emplacement_stock = "REBUT"

    din = db.execute(select(Don.din).where(Don.id == poche.don_id)).scalar_one_or_none()
    log_event(
        db,
        aggregate_type="poche",
        aggregate_id=poche.id,
        event_type="poche.detruite",
        payload={
            "din": din,
            "motif": payload.motif,
            "commentaire": payload.commentaire,
            "par": str(user.id) if user else None,
            **previous,
        },
    )
    db.commit()
    db.refresh(poche)
    return poche
