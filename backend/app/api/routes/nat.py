import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.audit.events import log_event
from app.db.models import Don, TestNAT, UserAccount
from app.db.session import get_db
from app.schemas.nat import TestNATCreate, TestNATOut, TestNATUpdate

router = APIRouter(prefix="/nat")


@router.post("", response_model=TestNATOut, status_code=201)
def create_test_nat(
    payload: TestNATCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> TestNAT:
    don = db.get(Don, payload.don_id)
    if don is None:
        raise HTTPException(status_code=404, detail="don introuvable")

    nat = TestNAT(**payload.model_dump())
    db.add(nat)
    db.flush()

    log_event(
        db,
        aggregate_type="test_nat",
        aggregate_id=nat.id,
        event_type="test_nat.cree",
        payload={"don_id": str(payload.don_id), "type_test": payload.type_test},
    )
    db.commit()
    db.refresh(nat)
    return nat


@router.get("", response_model=list[TestNATOut])
def list_tests_nat(
    don_id: uuid.UUID | None = Query(default=None),
    type_test: str | None = Query(default=None),
    resultat_qualitatif: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
) -> list[TestNAT]:
    stmt = select(TestNAT)
    if don_id:
        stmt = stmt.where(TestNAT.don_id == don_id)
    if type_test:
        stmt = stmt.where(TestNAT.type_test == type_test)
    if resultat_qualitatif:
        stmt = stmt.where(TestNAT.resultat_qualitatif == resultat_qualitatif)
    return list(
        db.execute(stmt.order_by(TestNAT.created_at.desc()).offset(offset).limit(limit)).scalars()
    )


@router.get("/{nat_id}", response_model=TestNATOut)
def get_test_nat(nat_id: uuid.UUID, db: Session = Depends(get_db)) -> TestNAT:
    nat = db.get(TestNAT, nat_id)
    if nat is None:
        raise HTTPException(status_code=404, detail="test nat introuvable")
    return nat


@router.patch("/{nat_id}", response_model=TestNATOut)
def update_test_nat(
    nat_id: uuid.UUID,
    payload: TestNATUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> TestNAT:
    nat = db.get(TestNAT, nat_id)
    if nat is None:
        raise HTTPException(status_code=404, detail="test nat introuvable")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(nat, field, value)

    log_event(
        db,
        aggregate_type="test_nat",
        aggregate_id=nat.id,
        event_type="test_nat.modifie",
        payload=payload.model_dump(exclude_unset=True),
    )
    db.commit()
    db.refresh(nat)
    return nat
