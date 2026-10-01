from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_optional, require_staff
from app.db.models import Partner, UserAccount
from app.db.session import get_db
from app.schemas.content import PartnerCreate, PartnerResponse, PartnerUpdate

router = APIRouter(prefix="/partners")


@router.get("", response_model=list[PartnerResponse])
def list_partners(
    db: Session = Depends(get_db),
    category: str | None = None,
    published_only: bool = True,
    skip: int = 0,
    limit: int = 200,
    current_user: UserAccount | None = Depends(get_current_user_optional),
) -> Any:
    """List partners, ordered for display."""
    if not published_only and (current_user is None or (current_user.role or "").upper() == "PATIENT"):
        raise HTTPException(status_code=403, detail="Accès réservé au personnel")
    query = select(Partner)
    if published_only:
        query = query.where(Partner.is_published.is_(True))
    if category:
        query = query.where(Partner.category == category)
    query = (
        query.order_by(Partner.display_order.asc(), Partner.created_at.asc())
        .offset(skip)
        .limit(limit)
    )
    return db.execute(query).scalars().all()


@router.get("/{id}", response_model=PartnerResponse)
def get_partner(
    id: UUID,
    db: Session = Depends(get_db),
    current_user: UserAccount | None = Depends(get_current_user_optional),
) -> Any:
    partner = db.get(Partner, id)
    if not partner or (
        not partner.is_published
        and (current_user is None or (current_user.role or "").upper() == "PATIENT")
    ):
        raise HTTPException(status_code=404, detail="Partner not found")
    return partner


@router.post("", response_model=PartnerResponse)
def create_partner(
    *,
    db: Session = Depends(get_db),
    partner_in: PartnerCreate,
    current_user: UserAccount = Depends(require_staff),
) -> Any:
    partner = Partner(**partner_in.model_dump())
    db.add(partner)
    db.commit()
    db.refresh(partner)
    return partner


@router.put("/{id}", response_model=PartnerResponse)
def update_partner(
    *,
    db: Session = Depends(get_db),
    id: UUID,
    partner_in: PartnerUpdate,
    current_user: UserAccount = Depends(require_staff),
) -> Any:
    partner = db.get(Partner, id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    for field, value in partner_in.model_dump(exclude_unset=True).items():
        setattr(partner, field, value)
    db.add(partner)
    db.commit()
    db.refresh(partner)
    return partner


@router.delete("/{id}")
def delete_partner(
    *,
    db: Session = Depends(get_db),
    id: UUID,
    current_user: UserAccount = Depends(require_staff),
) -> Any:
    partner = db.get(Partner, id)
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    db.delete(partner)
    db.commit()
    return {"ok": True}
