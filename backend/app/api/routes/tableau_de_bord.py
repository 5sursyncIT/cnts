"""Synthèse opérationnelle pour la page d'accueil du Back Office (tout le personnel)."""

import datetime as dt

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.db.models import CampagneCollecte, Commande, Don, Donneur, Hopital, Poche
from app.db.session import get_db

router = APIRouter(prefix="/tableau-de-bord")

# Commandes à traiter par la distribution.
STATUTS_COMMANDE_EN_COURS = ("BROUILLON", "VALIDEE")
PEREMPTION_ALERTE_JOURS = 7


@router.get("")
def tableau_de_bord(db: Session = Depends(get_db)) -> dict:
    today = dt.date.today()
    poche_disponible = (Poche.statut_distribution == "DISPONIBLE") & (Poche.statut_stock == "EN_STOCK")

    donneurs_total = db.execute(
        select(func.count(Donneur.id)).where(Donneur.deleted_at.is_(None))
    ).scalar_one()
    dons_30j = db.execute(
        select(func.count(Don.id)).where(Don.date_don >= today - dt.timedelta(days=30))
    ).scalar_one()
    poches_disponibles = db.execute(
        select(func.count(Poche.id)).where(poche_disponible, Poche.date_peremption >= today)
    ).scalar_one()
    poches_peremption_proche = db.execute(
        select(func.count(Poche.id)).where(
            poche_disponible,
            Poche.date_peremption >= today,
            Poche.date_peremption <= today + dt.timedelta(days=PEREMPTION_ALERTE_JOURS),
        )
    ).scalar_one()

    stock = db.execute(
        select(Poche.type_produit, Poche.groupe_sanguin, func.count(Poche.id))
        .where(poche_disponible, Poche.date_peremption >= today)
        .group_by(Poche.type_produit, Poche.groupe_sanguin)
    ).all()

    commandes_par_statut = dict(
        db.execute(select(Commande.statut, func.count(Commande.id)).group_by(Commande.statut)).all()
    )
    commandes_recentes = list(
        db.execute(
            select(Commande)
            .where(Commande.statut.in_(STATUTS_COMMANDE_EN_COURS))
            .options(selectinload(Commande.lignes))
            .order_by(Commande.date_demande.desc())
            .limit(5)
        ).scalars()
    )
    hopitaux = {
        h.id: h.nom
        for h in db.execute(
            select(Hopital).where(Hopital.id.in_({c.hopital_id for c in commandes_recentes}))
        ).scalars()
    } if commandes_recentes else {}

    donneurs_par_region = db.execute(
        select(Donneur.region, func.count(Donneur.id))
        .where(Donneur.deleted_at.is_(None), Donneur.region.is_not(None))
        .group_by(Donneur.region)
    ).all()

    collectes = list(
        db.execute(
            select(CampagneCollecte)
            .where(
                CampagneCollecte.statut.in_(("PLANIFIEE", "EN_COURS")),
                CampagneCollecte.date_fin >= dt.datetime.now(dt.timezone.utc),
            )
            .order_by(CampagneCollecte.date_debut)
            .limit(5)
        ).scalars()
    )

    return {
        "kpis": {
            "donneurs_total": donneurs_total,
            "dons_30j": dons_30j,
            "poches_disponibles": poches_disponibles,
            "poches_peremption_proche": poches_peremption_proche,
            "commandes_en_cours": sum(commandes_par_statut.get(s, 0) for s in STATUTS_COMMANDE_EN_COURS),
        },
        "stock": [
            {"type_produit": t, "groupe_sanguin": g or "INCONNU", "count": n} for t, g, n in stock
        ],
        "commandes_par_statut": commandes_par_statut,
        "commandes_recentes": [
            {
                "id": str(c.id),
                "statut": c.statut,
                "date_demande": c.date_demande.isoformat(),
                "hopital": hopitaux.get(c.hopital_id, "—"),
                "lignes": [
                    {"type_produit": ligne.type_produit, "groupe_sanguin": ligne.groupe_sanguin, "quantite": ligne.quantite}
                    for ligne in c.lignes
                ],
            }
            for c in commandes_recentes
        ],
        "donneurs_par_region": {region: n for region, n in donneurs_par_region},
        "collectes_a_venir": [
            {
                "id": str(c.id),
                "nom": c.nom,
                "lieu": c.lieu,
                "date_debut": c.date_debut.isoformat(),
                "date_fin": c.date_fin.isoformat(),
                "statut": c.statut,
                "objectif_dons": c.objectif_dons,
            }
            for c in collectes
        ],
        "peremption_alerte_jours": PEREMPTION_ALERTE_JOURS,
    }
