"""Formulaire de contact du portail public → boîte de réception du Back Office."""

import datetime as dt
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import require_staff
from app.db.models import ContactMessage
from app.db.session import get_db
from app.schemas.contact import (
    ContactAck,
    ContactMessageCreate,
    ContactMessageOut,
    ContactMessageUpdate,
)

router = APIRouter(prefix="/contact")

# Le middleware de limitation est désactivé quand CNTS_ENV=dev (cas du serveur
# live) : on borne donc ici le nombre de messages par IP.
MAX_MESSAGES_PER_HOUR = 5


def _client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()[:64]
    return request.client.host if request.client else None


@router.post("", response_model=ContactAck, status_code=201)
def create_message(
    payload: ContactMessageCreate, request: Request, db: Session = Depends(get_db)
) -> ContactAck:
    """Public : enregistre un message du formulaire de contact."""
    if payload.website:
        # Robot : on répond comme en cas de succès, sans rien enregistrer.
        return ContactAck()

    ip = _client_ip(request)
    if ip:
        since = dt.datetime.now(dt.timezone.utc) - dt.timedelta(hours=1)
        recent = db.execute(
            select(func.count(ContactMessage.id)).where(
                ContactMessage.client_ip == ip, ContactMessage.created_at >= since
            )
        ).scalar_one()
        if recent >= MAX_MESSAGES_PER_HOUR:
            raise HTTPException(status_code=429, detail="Trop de messages, réessayez plus tard")

    db.add(
        ContactMessage(
            **payload.model_dump(exclude={"website"}),
            client_ip=ip,
        )
    )
    db.commit()
    return ContactAck()


@router.get("", response_model=list[ContactMessageOut], dependencies=[Depends(require_staff)])
def list_messages(
    status: str | None = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
) -> Any:
    query = select(ContactMessage)
    if status:
        query = query.where(ContactMessage.status == status)
    query = query.order_by(ContactMessage.created_at.desc()).offset(skip).limit(limit)
    return db.execute(query).scalars().all()


@router.patch(
    "/{id}", response_model=ContactMessageOut, dependencies=[Depends(require_staff)]
)
def update_message(id: UUID, payload: ContactMessageUpdate, db: Session = Depends(get_db)) -> Any:
    item = db.get(ContactMessage, id)
    if not item:
        raise HTTPException(status_code=404, detail="Message introuvable")
    item.status = payload.status
    db.commit()
    db.refresh(item)
    return item
