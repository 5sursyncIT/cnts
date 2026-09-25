"""Règles d'éligibilité au don du sang (centralisées).

Utilisé à la fois par l'endpoint de consultation (`GET /donneurs/{id}/eligibilite`)
et par la création d'un don (`POST /dons`) pour appliquer la règle côté serveur.

Le modèle reste volontairement simple — il ne couvre PAS toutes les contre-indications
médicales (poids, hémoglobine, voyages, traitements, etc.), qui relèvent de l'entretien
pré-don. Il encode les deux garde-fous objectivables à partir des données stockées :
l'âge et le délai inter-don (qui dépend du type du dernier don).
"""

import datetime as dt
from dataclasses import dataclass

from app.core.dates import add_months

AGE_MIN = 18
# Règle officielle du CNTS (cnts.gouv.sn, « Qui peut donner ? ») : 18 à 60 ans.
AGE_MAX = 60

# Délai inter-don pour le sang total, en mois calendaires, selon le sexe
# (CNTS : hommes tous les 3 mois, femmes tous les 4 mois).
WHOLE_BLOOD_INTERVAL_MONTHS = {"H": 3, "F": 4}
# Délai inter-don après une aphérèse (plaquettes / plasma), en jours.
APHERESE_INTERVAL_DAYS = 14
# Types de don considérés comme aphérèse (délai court).
APHERESE_TYPES = {"PLAQUETTES", "PLASMA", "APHERESE", "PLASMAPHERESE", "CYTAPHERESE"}


@dataclass
class Eligibilite:
    eligible: bool
    eligible_le: dt.date | None
    raison: str
    delai_jours: int | None = None
    age: int | None = None


def calcul_age(date_naissance: dt.date | None, ref_date: dt.date) -> int | None:
    if date_naissance is None:
        return None
    return (
        ref_date.year
        - date_naissance.year
        - ((ref_date.month, ref_date.day) < (date_naissance.month, date_naissance.day))
    )


def evaluer_eligibilite(
    *,
    sexe: str | None,
    date_naissance: dt.date | None,
    dernier_don: dt.date | None,
    dernier_type_don: str | None = None,
    ref_date: dt.date,
) -> Eligibilite:
    """Évalue l'éligibilité d'un donneur à une date de référence donnée."""
    age = calcul_age(date_naissance, ref_date)
    if age is not None and age < AGE_MIN:
        return Eligibilite(
            eligible=False,
            eligible_le=None,
            raison=f"Âge insuffisant ({age} ans — minimum {AGE_MIN} ans)",
            age=age,
        )
    if age is not None and age > AGE_MAX:
        return Eligibilite(
            eligible=False,
            eligible_le=None,
            raison=f"Âge au-delà de la limite ({age} ans — maximum {AGE_MAX} ans)",
            age=age,
        )

    if dernier_don is None:
        return Eligibilite(
            eligible=True,
            eligible_le=None,
            raison="Premier don — aucun délai requis",
            age=age,
        )

    if dernier_type_don and dernier_type_don.upper() in APHERESE_TYPES:
        eligible_le = dernier_don + dt.timedelta(days=APHERESE_INTERVAL_DAYS)
        regle = f"délai aphérèse de {APHERESE_INTERVAL_DAYS} jours"
    else:
        months = WHOLE_BLOOD_INTERVAL_MONTHS.get((sexe or "").upper(), 3)
        eligible_le = add_months(dernier_don, months)
        sexe_label = "homme" if (sexe or "").upper() == "H" else "femme"
        regle = f"délai sang total {sexe_label} de {months} mois"

    is_eligible = ref_date >= eligible_le
    delai = (eligible_le - ref_date).days if not is_eligible else None
    raison = (
        "Éligible au don"
        if is_eligible
        else f"Délai inter-don non respecté ({regle})"
    )
    return Eligibilite(
        eligible=is_eligible,
        eligible_le=eligible_le,
        raison=raison,
        delai_jours=delai,
        age=age,
    )
