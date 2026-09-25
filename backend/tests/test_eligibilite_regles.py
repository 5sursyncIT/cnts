"""Règles officielles du CNTS : 18 à 60 ans ; hommes tous les 3 mois, femmes tous les 4 mois."""

import datetime as dt

from app.core.eligibilite import evaluer_eligibilite

REF = dt.date(2026, 9, 25)


def _eval(**kw):
    base = {"sexe": "H", "date_naissance": dt.date(1990, 1, 1), "dernier_don": None}
    return evaluer_eligibilite(**{**base, **kw}, ref_date=REF)


def test_age_limits():
    assert not _eval(date_naissance=dt.date(2009, 1, 1)).eligible  # 17 ans
    assert _eval(date_naissance=dt.date(2008, 9, 25)).eligible  # 18 ans
    assert _eval(date_naissance=dt.date(1966, 1, 1)).eligible  # 60 ans
    r = _eval(date_naissance=dt.date(1965, 9, 24))  # 61 ans
    assert not r.eligible and "60" in r.raison


def test_men_wait_three_months():
    assert not _eval(dernier_don=dt.date(2026, 7, 1)).eligible
    r = _eval(dernier_don=dt.date(2026, 6, 25))
    assert r.eligible


def test_women_wait_four_months():
    assert not _eval(sexe="F", dernier_don=dt.date(2026, 6, 25)).eligible
    assert _eval(sexe="F", dernier_don=dt.date(2026, 5, 25)).eligible
