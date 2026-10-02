"""Créneaux de rendez-vous d'un lieu (fonctions pures, testables sans base).

Heure de Dakar = UTC toute l'année (pas d'heure d'été) : les heures d'ouverture
saisies dans les horaires sont donc directement des heures UTC.
"""

import datetime as dt
from dataclasses import dataclass
from typing import Any

UTC = dt.timezone.utc


@dataclass(frozen=True)
class RegleLieu:
    horaires: dict[str, list[list[str]]]
    fermetures: list[str]
    duree_creneau_min: int
    capacite_creneau: int
    delai_min_heures: int
    horizon_jours: int

    @classmethod
    def depuis(cls, lieu: Any) -> "RegleLieu":
        return cls(
            horaires=lieu.horaires or {},
            fermetures=list(lieu.fermetures or []),
            duree_creneau_min=lieu.duree_creneau_min,
            capacite_creneau=lieu.capacite_creneau,
            delai_min_heures=lieu.delai_min_heures,
            horizon_jours=lieu.horizon_jours,
        )


def _heure(valeur: str) -> dt.time:
    h, m = valeur.split(":")
    return dt.time(int(h), int(m))


def debuts_du_jour(regle: RegleLieu, jour: dt.date) -> list[dt.datetime]:
    """Débuts des créneaux d'un jour selon les horaires (sans tenir compte du remplissage)."""
    if jour.isoformat() in regle.fermetures:
        return []
    pas = dt.timedelta(minutes=regle.duree_creneau_min)
    debuts: list[dt.datetime] = []
    for ouverture, fermeture in regle.horaires.get(str(jour.isoweekday()), []):
        t = dt.datetime.combine(jour, _heure(ouverture), tzinfo=UTC)
        fin = dt.datetime.combine(jour, _heure(fermeture), tzinfo=UTC)
        while t + pas <= fin:
            debuts.append(t)
            t += pas
    return debuts


def bornes(regle: RegleLieu, maintenant: dt.datetime) -> tuple[dt.datetime, dt.date]:
    """Premier instant réservable et dernier jour réservable."""
    return (
        maintenant + dt.timedelta(hours=regle.delai_min_heures),
        maintenant.astimezone(UTC).date() + dt.timedelta(days=regle.horizon_jours),
    )


def creneaux_disponibles(
    regle: RegleLieu, jour: dt.date, maintenant: dt.datetime, occupes: dict[dt.datetime, int]
) -> list[tuple[dt.datetime, int]]:
    """Créneaux réservables d'un jour avec le nombre de places restantes (complets exclus)."""
    premier, dernier_jour = bornes(regle, maintenant)
    if jour > dernier_jour:
        return []
    resultat = []
    for debut in debuts_du_jour(regle, jour):
        if debut < premier:
            continue
        restantes = regle.capacite_creneau - occupes.get(debut, 0)
        if restantes > 0:
            resultat.append((debut, restantes))
    return resultat


def erreur_creneau(regle: RegleLieu, debut: dt.datetime, maintenant: dt.datetime) -> str | None:
    """Message d'erreur si `debut` n'est pas un créneau réservable du lieu (hors remplissage)."""
    debut = debut.astimezone(UTC)
    premier, dernier_jour = bornes(regle, maintenant)
    if debut < premier:
        return f"Ce créneau est trop proche : réservez au moins {regle.delai_min_heures} h à l'avance."
    if debut.date() > dernier_jour:
        return f"Les rendez-vous se prennent au plus {regle.horizon_jours} jours à l'avance."
    if debut not in debuts_du_jour(regle, debut.date()):
        return "Ce créneau n'existe pas : le centre est fermé à cette heure-là."
    return None
