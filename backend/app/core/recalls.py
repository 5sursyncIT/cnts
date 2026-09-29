"""Règles communes de blocage des produits concernés par un rappel actif."""

from sqlalchemy import and_, exists, or_, select
from sqlalchemy.orm import Session, aliased

from app.db.models import Don, Poche, RappelLot


def hors_rappel_actif():
    """Expression à utiliser dans les requêtes joignant Poche et Don."""
    parent = aliased(Poche)
    return ~exists(
        select(RappelLot.id).where(
            RappelLot.statut != "CLOTURE",
            or_(
                and_(RappelLot.type_cible == "DIN", RappelLot.valeur_cible == Don.din),
                and_(
                    RappelLot.type_cible == "LOT",
                    Poche.lot.is_not(None),
                    RappelLot.valeur_cible == Poche.lot,
                ),
                and_(
                    RappelLot.type_cible == "LOT",
                    exists(select(parent.id).where(
                        parent.id == Poche.source_poche_id,
                        parent.lot == RappelLot.valeur_cible,
                    )).correlate(Poche, RappelLot),
                ),
            ),
        ).correlate(Poche, Don)
    )


def poche_sous_rappel(db: Session, poche: Poche) -> bool:
    return not bool(
        db.execute(
            select(Poche.id)
            .join(Don, Don.id == Poche.don_id)
            .where(Poche.id == poche.id, hors_rappel_actif())
        ).scalar_one_or_none()
    )
