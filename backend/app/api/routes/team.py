from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import TeamMember, UserAccount
from app.db.session import get_db
from app.schemas.content import (
    TeamMemberCreate,
    TeamMemberResponse,
    TeamMemberUpdate,
)

router = APIRouter(prefix="/team")


@router.get("", response_model=list[TeamMemberResponse])
def list_team(
    db: Session = Depends(get_db),
    published_only: bool = True,
    skip: int = 0,
    limit: int = 200,
) -> Any:
    """List team members, ordered for display."""
    query = select(TeamMember)
    if published_only:
        query = query.where(TeamMember.is_published.is_(True))
    query = (
        query.order_by(TeamMember.display_order.asc(), TeamMember.created_at.asc())
        .offset(skip)
        .limit(limit)
    )
    return db.execute(query).scalars().all()


@router.get("/{id}", response_model=TeamMemberResponse)
def get_team_member(id: UUID, db: Session = Depends(get_db)) -> Any:
    member = db.get(TeamMember, id)
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    return member


@router.post("", response_model=TeamMemberResponse)
def create_team_member(
    *,
    db: Session = Depends(get_db),
    member_in: TeamMemberCreate,
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    member = TeamMember(**member_in.model_dump())
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.put("/{id}", response_model=TeamMemberResponse)
def update_team_member(
    *,
    db: Session = Depends(get_db),
    id: UUID,
    member_in: TeamMemberUpdate,
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    member = db.get(TeamMember, id)
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    for field, value in member_in.model_dump(exclude_unset=True).items():
        setattr(member, field, value)
    db.add(member)
    db.commit()
    db.refresh(member)
    return member


@router.delete("/{id}")
def delete_team_member(
    *,
    db: Session = Depends(get_db),
    id: UUID,
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    member = db.get(TeamMember, id)
    if not member:
        raise HTTPException(status_code=404, detail="Team member not found")
    db.delete(member)
    db.commit()
    return {"ok": True}
