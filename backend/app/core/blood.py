from __future__ import annotations

import re


def normalize_groupe_sanguin(value: str) -> str:
    v = value.strip().upper().replace(" ", "")
    v = v.replace("POS", "+").replace("NEG", "-")
    if v in {"A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"}:
        return v
    raise ValueError("groupe_sanguin invalide (attendu: O+/O-/A+/A-/B+/B-/AB+/AB-)")


def groupe_from_analyses(*, abo: str, rh: str) -> str:
    abo_v = abo.strip().upper()
    if abo_v not in {"A", "B", "AB", "O"}:
        raise ValueError("ABO invalide (attendu: A/B/AB/O)")
    rh_v = rh.strip().upper()
    if rh_v not in {"POS", "NEG"}:
        raise ValueError("RH invalide (attendu: POS/NEG)")
    return f"{abo_v}{'+' if rh_v == 'POS' else '-'}"


def validate_analyse_resultat(*, type_test: str, resultat: str) -> None:
    t = type_test.strip().upper()
    r = resultat.strip().upper()
    if t == "ABO":
        if r not in {"EN_ATTENTE", "A", "B", "AB", "O"}:
            raise ValueError("resultat ABO invalide (EN_ATTENTE/A/B/AB/O)")
        return
    if t == "RH":
        if r not in {"EN_ATTENTE", "POS", "NEG"}:
            raise ValueError("resultat RH invalide (EN_ATTENTE/POS/NEG)")
        return
    if r not in {"EN_ATTENTE", "POSITIF", "NEGATIF"}:
        raise ValueError("resultat invalide (EN_ATTENTE/POSITIF/NEGATIF)")


def is_compatible_rbc(*, receveur: str, donneur: str) -> bool:
    r = normalize_groupe_sanguin(receveur)
    d = normalize_groupe_sanguin(donneur)

    receveur_abo, receveur_rh = _split_groupe(r)
    donneur_abo, donneur_rh = _split_groupe(d)

    if not _abo_compatible_rbc(receveur_abo, donneur_abo):
        return False
    if receveur_rh == "-" and donneur_rh == "+":
        return False
    return True


def is_compatible_plasma(*, receveur: str, donneur: str) -> bool:
    r = normalize_groupe_sanguin(receveur)
    d = normalize_groupe_sanguin(donneur)

    receveur_abo, _ = _split_groupe(r)
    donneur_abo, _ = _split_groupe(d)

    compatibles = {
        "O": {"O"},
        "A": {"A", "AB"},
        "B": {"B", "AB"},
        "AB": {"AB"},
    }
    return donneur_abo in compatibles[receveur_abo]


def requires_crossmatch(*, type_produit: str) -> bool:
    return type_produit.strip().upper() == "CGR"


def requires_abo_compatibility(*, type_produit: str) -> bool:
    return type_produit.strip().upper() in {"CGR", "PFC", "CP"}


def _split_groupe(groupe: str) -> tuple[str, str]:
    m = re.fullmatch(r"(A|B|AB|O)([+-])", groupe)
    if not m:
        raise ValueError("groupe_sanguin invalide")
    return m.group(1), m.group(2)


def _abo_compatible_rbc(receveur_abo: str, donneur_abo: str) -> bool:
    compatibles = {
        "O": {"O"},
        "A": {"A", "O"},
        "B": {"B", "O"},
        "AB": {"A", "B", "AB", "O"},
    }
    return donneur_abo in compatibles[receveur_abo]
