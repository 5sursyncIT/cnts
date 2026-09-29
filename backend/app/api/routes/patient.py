import logging
import traceback
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import (
    CarteDonneur,
    DocumentMedical,
    Don,
    PointsHistorique,
    RendezVous,
    UserAccount,
)
from app.db.session import get_db
from app.schemas.patient import (
    CartePatientResponse,
    DocumentMedicalResponse,
    DonneurResponse,
    DonneurUpdate,
    DonPatientResponse,
    RendezVousCreate,
    RendezVousResponse,
)

router = APIRouter(prefix="/me")
logger = logging.getLogger(__name__)

# --- Profile Management ---


@router.get("", response_model=DonneurResponse)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """
    Get current user's donor profile.
    """
    if not current_user.donneur:
        raise HTTPException(status_code=404, detail="Donor profile not found for this user")
    return current_user.donneur


@router.put("", response_model=DonneurResponse)
def update_my_profile(
    *,
    db: Session = Depends(get_db),
    profile_in: DonneurUpdate,
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """
    Update current user's donor profile.
    """
    donneur = current_user.donneur
    if not donneur:
        raise HTTPException(status_code=404, detail="Donor profile not found")

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(donneur, field, value)

    db.add(donneur)
    db.commit()
    db.refresh(donneur)
    return donneur


# --- Rendez-Vous Management ---


@router.get("/appointments", response_model=list[RendezVousResponse])
def get_my_appointments(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """
    List my appointments.
    """
    if not current_user.donneur:
        raise HTTPException(status_code=404, detail="Donor profile required")

    query = select(RendezVous).where(RendezVous.donneur_id == current_user.donneur.id)
    query = query.order_by(RendezVous.date_prevue.desc()).offset(skip).limit(limit)
    return db.execute(query).scalars().all()


@router.post("/appointments", response_model=RendezVousResponse)
def create_appointment(
    *,
    db: Session = Depends(get_db),
    rdv_in: RendezVousCreate,
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """
    Schedule a new appointment.
    """
    if not current_user.donneur:
        raise HTTPException(status_code=404, detail="Donor profile required")

    date_prevue = rdv_in.date_prevue
    if date_prevue.tzinfo is None:
        date_prevue = date_prevue.replace(tzinfo=UTC)
    if date_prevue <= datetime.now(UTC):
        raise HTTPException(status_code=422, detail="La date du rendez-vous doit être dans le futur")

    try:
        rdv = RendezVous(
            **rdv_in.model_dump(), donneur_id=current_user.donneur.id, statut="CONFIRME"
        )
        db.add(rdv)
        db.commit()
        db.refresh(rdv)
        return rdv
    except Exception as e:
        logger.error(f"Error creating appointment: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Erreur lors de la création du rendez-vous")


@router.put("/appointments/{id}", response_model=RendezVousResponse)
def cancel_appointment(
    *,
    db: Session = Depends(get_db),
    id: UUID,
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """
    Cancel an appointment.
    """
    if not current_user.donneur:
        raise HTTPException(status_code=404, detail="Donor profile required")

    rdv = db.get(RendezVous, id)
    if not rdv or rdv.donneur_id != current_user.donneur.id:
        raise HTTPException(status_code=404, detail="Appointment not found")

    rdv.statut = "ANNULE"
    db.add(rdv)
    db.commit()
    db.refresh(rdv)
    return rdv


# --- Medical Documents ---


@router.get("/documents", response_model=list[DocumentMedicalResponse])
def get_my_documents(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """
    List medical documents (results, certificates).
    """
    if not current_user.donneur:
        raise HTTPException(status_code=404, detail="Donor profile required")

    query = select(DocumentMedical).where(DocumentMedical.donneur_id == current_user.donneur.id)
    query = query.order_by(DocumentMedical.date_document.desc()).offset(skip).limit(limit)
    return db.execute(query).scalars().all()


# --- Dons & carte donneur ---


@router.get("/dons", response_model=list[DonPatientResponse])
def get_my_donations(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """
    Historique des dons du donneur connecté (date et type uniquement).
    """
    if not current_user.donneur:
        raise HTTPException(status_code=404, detail="Donor profile required")

    query = select(Don).where(Don.donneur_id == current_user.donneur.id)
    query = query.order_by(Don.date_don.desc()).offset(skip).limit(min(limit, 200))
    return db.execute(query).scalars().all()


@router.get("/carte", response_model=CartePatientResponse)
def get_my_card(
    db: Session = Depends(get_db),
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """
    Carte de fidélité du donneur connecté et ses 20 derniers mouvements de points.
    """
    if not current_user.donneur:
        raise HTTPException(status_code=404, detail="Donor profile required")

    carte = db.execute(
        select(CarteDonneur).where(CarteDonneur.donneur_id == current_user.donneur.id)
    ).scalar_one_or_none()
    if carte is None:
        raise HTTPException(status_code=404, detail="Aucune carte donneur")

    historique = (
        db.execute(
            select(PointsHistorique)
            .where(PointsHistorique.carte_id == carte.id)
            .order_by(PointsHistorique.created_at.desc())
            .limit(20)
        )
        .scalars()
        .all()
    )
    return CartePatientResponse(
        numero_carte=carte.numero_carte,
        niveau=carte.niveau,
        points=carte.points,
        total_dons=carte.total_dons,
        date_premier_don=carte.date_premier_don,
        date_dernier_don=carte.date_dernier_don,
        is_active=carte.is_active,
        historique=historique,
    )
