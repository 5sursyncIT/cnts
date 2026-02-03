import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import case, func, select
from sqlalchemy.orm import Session, joinedload

from app.core.blood import normalize_groupe_sanguin
from app.db.models import Don, Poche
from app.db.session import get_db
from app.schemas.etiquettes import EtiquetteProduitOut
from app.schemas.poches import (
    PocheCreate,
    PocheOut,
    PochePeremptionAlert,
    PocheUpdate,
    StockSummary,
)

router = APIRouter(prefix="/poches")


@router.get("/disponibles", response_model=list[PocheOut])
def list_poches_disponibles(
    type_produit: str | None = Query(default=None),
    groupe_sanguin: str | None = Query(default=None, max_length=8),
    limit: int = Query(default=200, le=500),
    db: Session = Depends(get_db),
) -> list[Poche]:
    stmt = select(Poche).where(Poche.statut_distribution == "DISPONIBLE")
    if type_produit is not None:
        stmt = stmt.where(Poche.type_produit == type_produit)
    if groupe_sanguin is not None:
        stmt = stmt.where(Poche.groupe_sanguin == normalize_groupe_sanguin(groupe_sanguin))
    stmt = stmt.order_by(Poche.date_peremption.asc(), Poche.created_at.asc()).limit(limit)
    return list(db.execute(stmt).scalars())


@router.post("", response_model=PocheOut, status_code=201)
def create_poche(payload: PocheCreate, db: Session = Depends(get_db)) -> Poche:
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

    poche = Poche(
        don_id=payload.don_id,
        type_produit=payload.type_produit,
        date_peremption=payload.date_peremption,
        emplacement_stock=payload.emplacement_stock,
        statut_distribution="NON_DISTRIBUABLE",
    )
    db.add(poche)
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
            func.sum(case((Poche.statut_distribution == "DISPONIBLE", 1), else_=0)).label("disponible"),
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
    row = (
        db.execute(
            select(Poche, Don.din, Don.date_don)
            .join(Don, Don.id == Poche.don_id)
            .where(Poche.id == poche_id)
        )
        .first()
    )
    if row is None:
        raise HTTPException(status_code=404, detail="poche not found")

    poche, din, date_don = row
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
) -> Poche:
    """
    Mettre à jour une poche.

    ATTENTION: Le changement de statut vers DISPONIBLE doit normalement
    passer par l'endpoint de libération biologique.
    """
    poche = db.get(Poche, poche_id)
    if poche is None:
        raise HTTPException(status_code=404, detail="poche not found")

    if payload.emplacement_stock is not None:
        poche.emplacement_stock = payload.emplacement_stock

    if payload.groupe_sanguin is not None:
        poche.groupe_sanguin = normalize_groupe_sanguin(payload.groupe_sanguin)

    if payload.code_produit_isbt is not None:
        poche.code_produit_isbt = payload.code_produit_isbt.strip() or None
    if payload.lot is not None:
        poche.lot = payload.lot.strip() or None
    if payload.division is not None:
        poche.division = payload.division

    if payload.statut_distribution is not None:
        if payload.statut_distribution in {"RESERVE", "DISTRIBUE"}:
            raise HTTPException(
                status_code=422,
                detail="Utiliser le workflow commandes (réservation/distribution)",
            )
        # Validation: ne pas permettre DISPONIBLE si le don n'est pas LIBERE
        if payload.statut_distribution == "DISPONIBLE":
            don = db.get(Don, poche.don_id)
            if don and don.statut_qualification != "LIBERE":
                raise HTTPException(
                    status_code=422,
                    detail="Impossible de rendre une poche DISPONIBLE si le don n'est pas LIBERE",
                )
        poche.statut_distribution = payload.statut_distribution

    db.commit()
    db.refresh(poche)
    return poche


@router.delete("/{poche_id}", status_code=204)
def delete_poche(poche_id: uuid.UUID, db: Session = Depends(get_db)) -> None:
    """Supprimer une poche (à utiliser avec précaution)."""
    poche = db.get(Poche, poche_id)
    if poche is None:
        raise HTTPException(status_code=404, detail="poche not found")

    # Ne pas permettre la suppression de poches déjà distribuées
    if poche.statut_distribution == "DISTRIBUE":
        raise HTTPException(
            status_code=422,
            detail="Impossible de supprimer une poche déjà distribuée",
        )

    db.delete(poche)
    db.commit()
