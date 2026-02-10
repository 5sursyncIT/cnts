import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import InterfaceAutomate, MessageAutomate, UserAccount
from app.db.session import get_db
from app.schemas.automates import (
    InterfaceAutomateCreate,
    InterfaceAutomateOut,
    InterfaceAutomateUpdate,
    MessageAutomateOut,
)

router = APIRouter(prefix="/automates")


@router.post("", response_model=InterfaceAutomateOut, status_code=201)
def create_interface(
    payload: InterfaceAutomateCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> InterfaceAutomate:
    existing = db.execute(
        select(InterfaceAutomate).where(InterfaceAutomate.code == payload.code)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=409, detail="une interface avec ce code existe deja")

    interface = InterfaceAutomate(**payload.model_dump())
    db.add(interface)
    db.flush()
    log_event(
        db,
        aggregate_type="interface_automate",
        aggregate_id=interface.id,
        event_type="interface.creee",
        payload={"code": interface.code, "protocole": interface.protocole},
    )
    db.commit()
    db.refresh(interface)
    return interface


@router.get("", response_model=list[InterfaceAutomateOut])
def list_interfaces(
    protocole: str | None = Query(default=None),
    is_active: bool | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[InterfaceAutomate]:
    stmt = select(InterfaceAutomate)
    if protocole:
        stmt = stmt.where(InterfaceAutomate.protocole == protocole)
    if is_active is not None:
        stmt = stmt.where(InterfaceAutomate.is_active == is_active)
    return list(
        db.execute(stmt.order_by(InterfaceAutomate.nom).offset(offset).limit(limit)).scalars()
    )


@router.get("/{interface_id}", response_model=InterfaceAutomateOut)
def get_interface(interface_id: uuid.UUID, db: Session = Depends(get_db)) -> InterfaceAutomate:
    interface = db.get(InterfaceAutomate, interface_id)
    if interface is None:
        raise HTTPException(status_code=404, detail="interface introuvable")
    return interface


@router.patch("/{interface_id}", response_model=InterfaceAutomateOut)
def update_interface(
    interface_id: uuid.UUID,
    payload: InterfaceAutomateUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> InterfaceAutomate:
    interface = db.get(InterfaceAutomate, interface_id)
    if interface is None:
        raise HTTPException(status_code=404, detail="interface introuvable")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(interface, field, value)
    log_event(
        db,
        aggregate_type="interface_automate",
        aggregate_id=interface.id,
        event_type="interface.modifiee",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(interface)
    return interface


@router.get("/messages", response_model=list[MessageAutomateOut])
def list_messages(
    interface_id: uuid.UUID | None = Query(default=None),
    statut: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[MessageAutomate]:
    stmt = select(MessageAutomate)
    if interface_id:
        stmt = stmt.where(MessageAutomate.interface_id == interface_id)
    if statut:
        stmt = stmt.where(MessageAutomate.statut == statut)
    return list(
        db.execute(
            stmt.order_by(MessageAutomate.created_at.desc()).offset(offset).limit(limit)
        ).scalars()
    )


@router.post("/{interface_id}/test")
def test_interface(
    interface_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> dict:
    interface = db.get(InterfaceAutomate, interface_id)
    if interface is None:
        raise HTTPException(status_code=404, detail="interface introuvable")
    if not interface.is_active:
        raise HTTPException(status_code=409, detail="interface desactivee")

    return {
        "interface_id": str(interface.id),
        "statut": "TEST_OK",
        "message": f"test de connectivite vers {interface.host}:{interface.port} simule avec succes",
    }
