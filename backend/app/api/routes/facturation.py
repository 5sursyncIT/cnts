import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import Facture, Hopital, LigneFacture, Paiement, Tarif, UserAccount
from app.db.session import get_db
from app.schemas.facturation import (
    FactureCreate,
    FactureOut,
    PaiementCreate,
    PaiementOut,
    TarifCreate,
    TarifOut,
)

router = APIRouter()


# ── Tarifs ────────────────────────────────────


@router.post("/tarifs", response_model=TarifOut, status_code=201)
def create_tarif(
    payload: TarifCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Tarif:
    tarif = Tarif(**payload.model_dump())
    db.add(tarif)
    db.flush()
    log_event(
        db,
        aggregate_type="tarif",
        aggregate_id=tarif.id,
        event_type="tarif.cree",
        payload={"type_produit": tarif.type_produit, "prix": tarif.prix_unitaire_fcfa},
    )
    db.commit()
    db.refresh(tarif)
    return tarif


@router.get("/tarifs", response_model=list[TarifOut])
def list_tarifs(
    type_produit: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[Tarif]:
    stmt = select(Tarif)
    if type_produit:
        stmt = stmt.where(Tarif.type_produit == type_produit)
    if is_active is not None:
        stmt = stmt.where(Tarif.is_active == is_active)
    return list(db.execute(stmt.order_by(Tarif.type_produit).offset(offset).limit(limit)).scalars())


# ── Factures ──────────────────────────────────


@router.post("/factures", response_model=FactureOut, status_code=201)
def create_facture(
    payload: FactureCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Facture:
    existing = db.execute(
        select(Facture).where(Facture.numero == payload.numero)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="une facture avec ce numero existe deja")

    hopital = db.get(Hopital, payload.hopital_id)
    if hopital is None:
        raise HTTPException(status_code=404, detail="hopital introuvable")

    montant_ht = sum(item.quantite * item.prix_unitaire_fcfa for item in payload.lignes)

    facture = Facture(
        numero=payload.numero,
        commande_id=payload.commande_id,
        hopital_id=payload.hopital_id,
        date_facture=payload.date_facture,
        montant_ht_fcfa=montant_ht,
        montant_ttc_fcfa=montant_ht,  # No VAT in Senegal for blood products
        date_echeance=payload.date_echeance,
    )
    db.add(facture)
    db.flush()

    for item in payload.lignes:
        ligne = LigneFacture(
            facture_id=facture.id,
            type_produit=item.type_produit,
            quantite=item.quantite,
            prix_unitaire_fcfa=item.prix_unitaire_fcfa,
            montant_fcfa=item.quantite * item.prix_unitaire_fcfa,
        )
        db.add(ligne)

    log_event(
        db,
        aggregate_type="facture",
        aggregate_id=facture.id,
        event_type="facture.emise",
        payload={"numero": facture.numero, "montant": montant_ht},
    )
    db.commit()
    db.refresh(facture)
    return facture


@router.get("/factures", response_model=list[FactureOut])
def list_factures(
    statut: str | None = Query(default=None),
    hopital_id: uuid.UUID | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[Facture]:
    stmt = select(Facture)
    if statut:
        stmt = stmt.where(Facture.statut == statut)
    if hopital_id:
        stmt = stmt.where(Facture.hopital_id == hopital_id)
    return list(
        db.execute(stmt.order_by(Facture.created_at.desc()).offset(offset).limit(limit)).scalars()
    )


@router.get("/factures/{facture_id}", response_model=FactureOut)
def get_facture(facture_id: uuid.UUID, db: Session = Depends(get_db)) -> Facture:
    facture = db.get(Facture, facture_id)
    if facture is None:
        raise HTTPException(status_code=404, detail="facture introuvable")
    return facture


# ── Paiements ────────────────────────────────


@router.post("/paiements", response_model=PaiementOut, status_code=201)
def create_paiement(
    payload: PaiementCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> Paiement:
    facture = db.get(Facture, payload.facture_id)
    if facture is None:
        raise HTTPException(status_code=404, detail="facture introuvable")
    if facture.statut == "ANNULEE":
        raise HTTPException(status_code=409, detail="facture annulee, paiement impossible")

    paiement = Paiement(**payload.model_dump())
    db.add(paiement)
    db.flush()

    # Update facture status based on total paid
    total_paye = db.execute(
        select(func.coalesce(func.sum(Paiement.montant_fcfa), 0)).where(
            Paiement.facture_id == facture.id
        )
    ).scalar()
    if total_paye >= facture.montant_ttc_fcfa:
        facture.statut = "PAYEE"
    elif total_paye > 0:
        facture.statut = "PAYEE_PARTIELLEMENT"

    log_event(
        db,
        aggregate_type="facture",
        aggregate_id=facture.id,
        event_type="paiement.enregistre",
        payload={"montant": payload.montant_fcfa, "mode": payload.mode_paiement},
    )
    db.commit()
    db.refresh(paiement)
    return paiement


# ── Statistiques ──────────────────────────────


@router.get("/statistiques")
def statistiques_facturation(db: Session = Depends(get_db)) -> dict:
    total_factures = db.execute(select(func.count(Facture.id))).scalar() or 0
    montant_total = db.execute(
        select(func.coalesce(func.sum(Facture.montant_ttc_fcfa), 0))
    ).scalar()
    total_paye = db.execute(select(func.coalesce(func.sum(Paiement.montant_fcfa), 0))).scalar()
    impayees = (
        db.execute(
            select(func.count(Facture.id)).where(
                Facture.statut.in_(["EMISE", "ENVOYEE", "PAYEE_PARTIELLEMENT"])
            )
        ).scalar()
        or 0
    )

    return {
        "total_factures": total_factures,
        "montant_total_fcfa": montant_total,
        "total_paye_fcfa": total_paye,
        "montant_impaye_fcfa": montant_total - total_paye,
        "factures_impayees": impayees,
    }
