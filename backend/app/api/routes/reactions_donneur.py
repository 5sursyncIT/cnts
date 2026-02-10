import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import Don, Donneur, ReactionAdverseDonneur, UserAccount
from app.db.session import get_db
from app.schemas.reactions_donneur import (
    ReactionAdverseDonneurCreate,
    ReactionAdverseDonneurOut,
    ReactionAdverseDonneurUpdate,
)

router = APIRouter(prefix="/reactions-donneur")


@router.post("", response_model=ReactionAdverseDonneurOut, status_code=201)
def create_reaction(
    payload: ReactionAdverseDonneurCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> ReactionAdverseDonneur:
    don = db.get(Don, payload.don_id)
    if don is None:
        raise HTTPException(status_code=404, detail="don introuvable")
    donneur = db.get(Donneur, payload.donneur_id)
    if donneur is None:
        raise HTTPException(status_code=404, detail="donneur introuvable")

    reaction = ReactionAdverseDonneur(**payload.model_dump())
    db.add(reaction)
    db.flush()

    log_event(
        db,
        aggregate_type="reaction_adverse_donneur",
        aggregate_id=reaction.id,
        event_type="reaction_donneur.declaree",
        payload={
            "don_id": str(payload.don_id),
            "type_reaction": payload.type_reaction,
            "gravite": payload.gravite,
        },
    )
    db.commit()
    db.refresh(reaction)
    return reaction


@router.get("", response_model=list[ReactionAdverseDonneurOut])
def list_reactions(
    donneur_id: uuid.UUID | None = Query(default=None),
    don_id: uuid.UUID | None = Query(default=None),
    gravite: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[ReactionAdverseDonneur]:
    stmt = select(ReactionAdverseDonneur)
    if donneur_id:
        stmt = stmt.where(ReactionAdverseDonneur.donneur_id == donneur_id)
    if don_id:
        stmt = stmt.where(ReactionAdverseDonneur.don_id == don_id)
    if gravite:
        stmt = stmt.where(ReactionAdverseDonneur.gravite == gravite)
    return list(
        db.execute(
            stmt.order_by(ReactionAdverseDonneur.created_at.desc()).offset(offset).limit(limit)
        ).scalars()
    )


@router.get("/{reaction_id}", response_model=ReactionAdverseDonneurOut)
def get_reaction(reaction_id: uuid.UUID, db: Session = Depends(get_db)) -> ReactionAdverseDonneur:
    reaction = db.get(ReactionAdverseDonneur, reaction_id)
    if reaction is None:
        raise HTTPException(status_code=404, detail="reaction introuvable")
    return reaction


@router.patch("/{reaction_id}", response_model=ReactionAdverseDonneurOut)
def update_reaction(
    reaction_id: uuid.UUID,
    payload: ReactionAdverseDonneurUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> ReactionAdverseDonneur:
    reaction = db.get(ReactionAdverseDonneur, reaction_id)
    if reaction is None:
        raise HTTPException(status_code=404, detail="reaction introuvable")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(reaction, field, value)

    log_event(
        db,
        aggregate_type="reaction_adverse_donneur",
        aggregate_id=reaction.id,
        event_type="reaction_donneur.modifiee",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(reaction)
    return reaction
