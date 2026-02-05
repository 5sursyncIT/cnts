import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.core.blood import groupe_from_analyses
from app.db.models import Analyse, Don, Hopital, Poche, UserAccount
from app.db.session import get_db
from app.schemas.analyses import AnalyseOut, LiberationBiologiqueOut

router = APIRouter(prefix="/liberation")

# Tests obligatoires selon les normes transfusionnelles
TESTS_OBLIGATOIRES = {"ABO", "RH", "VIH", "VHB", "VHC", "SYPHILIS"}


def _notify_hopitaux_poche_disponible(db: Session, *, poche: Poche, din: str) -> None:
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
                "date_peremption": poche.date_peremption.isoformat() if poche.date_peremption else None,
            },
        )


@router.get("/{don_id}", response_model=LiberationBiologiqueOut)
def verifier_liberation(don_id: uuid.UUID, db: Session = Depends(get_db)) -> LiberationBiologiqueOut:
    """
    Vérifier si un don peut être libéré biologiquement.

    Règles de libération (DEVBOOK.md):
    1. Tous les tests obligatoires doivent être effectués
    2. Tous les résultats doivent être NEGATIF
    3. Aucun test ne doit être POSITIF ou EN_ATTENTE

    Tests obligatoires: ABO, RH, VIH, VHB, VHC, SYPHILIS
    """
    # Charger le don avec ses analyses
    stmt = select(Don).where(Don.id == don_id).options(selectinload(Don.analyses))
    don = db.execute(stmt).scalar_one_or_none()

    if don is None:
        raise HTTPException(status_code=404, detail="don not found")

    analyses = don.analyses
    analyses_out = [AnalyseOut.model_validate(a) for a in analyses]

    # Vérifier si tous les tests obligatoires sont présents
    tests_effectues = {a.type_test for a in analyses}
    tests_manquants = TESTS_OBLIGATOIRES - tests_effectues

    if tests_manquants:
        return LiberationBiologiqueOut(
            don_id=don.id,
            din=don.din,
            statut_qualification=don.statut_qualification,
            liberable=False,
            raison=f"Tests manquants: {', '.join(sorted(tests_manquants))}",
            tests_manquants=sorted(list(tests_manquants)),
            analyses=analyses_out,
        )

    tests_problematiques: list[Analyse] = []
    for a in analyses:
        if a.type_test in {"ABO", "RH"}:
            if a.resultat == "EN_ATTENTE":
                tests_problematiques.append(a)
        else:
            if a.resultat != "NEGATIF":
                tests_problematiques.append(a)

    if tests_problematiques:
        resultats = [f"{a.type_test}={a.resultat}" for a in tests_problematiques]
        tests_positifs_names = [a.type_test for a in tests_problematiques]
        return LiberationBiologiqueOut(
            don_id=don.id,
            din=don.din,
            statut_qualification=don.statut_qualification,
            liberable=False,
            raison=f"Tests non conformes: {', '.join(resultats)}",
            tests_positifs=tests_positifs_names,
            analyses=analyses_out,
        )

    # Tous les tests sont négatifs, le don est libérable
    return LiberationBiologiqueOut(
        don_id=don.id,
        din=don.din,
        statut_qualification=don.statut_qualification,
        liberable=True,
        raison=None,
        analyses=analyses_out,
    )


@router.post("/{don_id}/liberer", response_model=LiberationBiologiqueOut)
def liberer_don(
    don_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> LiberationBiologiqueOut:
    """
    Effectuer la libération biologique d'un don.

    Cette action met à jour:
    1. Le statut du don: EN_ATTENTE → QUALIFIE → LIBERE
    2. Le statut des poches associées: NON_DISTRIBUABLE → DISPONIBLE

    RÈGLE CRITIQUE (DEVBOOK.md): Cette opération ne peut réussir que si
    tous les tests obligatoires sont négatifs.
    """
    # Vérifier d'abord si le don est libérable
    stmt = select(Don).where(Don.id == don_id).options(selectinload(Don.analyses))
    don = db.execute(stmt).scalar_one_or_none()

    if don is None:
        raise HTTPException(status_code=404, detail="don not found")

    # Réutiliser la logique de vérification
    verification = verifier_liberation(don_id, db)

    if not verification.liberable:
        raise HTTPException(
            status_code=422,
            detail=f"Don non libérable: {verification.raison}",
        )

    # Le don est déjà libéré
    if don.statut_qualification == "LIBERE":
        return verification

    # Effectuer la libération
    don.statut_qualification = "LIBERE"

    # Mettre à jour toutes les poches associées
    stmt_poches = select(Poche).where(Poche.don_id == don_id)
    poches = db.execute(stmt_poches).scalars().all()

    abo = next((a.resultat for a in don.analyses if a.type_test == "ABO"), None)
    rh = next((a.resultat for a in don.analyses if a.type_test == "RH"), None)
    groupe_sanguin: str | None = None
    if abo is not None and rh is not None and abo != "EN_ATTENTE" and rh != "EN_ATTENTE":
        groupe_sanguin = groupe_from_analyses(abo=abo, rh=rh)

    released_poches: list[Poche] = []
    for poche in poches:
        if poche.statut_distribution == "NON_DISTRIBUABLE":
            poche.statut_distribution = "DISPONIBLE"
            released_poches.append(poche)
        if groupe_sanguin is not None:
            poche.groupe_sanguin = groupe_sanguin

    for poche in released_poches:
        log_event(
            db,
            aggregate_type="poche",
            aggregate_id=poche.id,
            event_type="poche.disponible",
            payload={
                "poche_id": str(poche.id),
                "din": don.din,
                "type_produit": poche.type_produit,
                "groupe_sanguin": poche.groupe_sanguin,
            },
        )
        _notify_hopitaux_poche_disponible(db, poche=poche, din=don.din)

    db.commit()
    db.refresh(don)

    # Recharger les analyses pour le résultat
    analyses_out = [AnalyseOut.model_validate(a) for a in don.analyses]

    return LiberationBiologiqueOut(
        don_id=don.id,
        din=don.din,
        statut_qualification=don.statut_qualification,
        liberable=True,
        raison=None,
        analyses=analyses_out,
    )
