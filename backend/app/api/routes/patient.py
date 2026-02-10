from typing import Any
from uuid import UUID
import logging
import traceback

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import Donneur, RendezVous, DocumentMedical, UserAccount
from app.db.session import get_db
from app.schemas.patient import (
    DonneurResponse, DonneurUpdate,
    RendezVousCreate, RendezVousResponse, RendezVousUpdate,
    DocumentMedicalResponse
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
    try:
        if not current_user.donneur:
            raise HTTPException(status_code=404, detail="Donor profile required")
            
        rdv = RendezVous(
            **rdv_in.model_dump(),
            donneur_id=current_user.donneur.id,
            statut="CONFIRME"
        )
        db.add(rdv)
        db.commit()
        db.refresh(rdv)
        return rdv
    except Exception as e:
        logger.error(f"Error creating appointment: {e}")
        logger.error(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))


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
