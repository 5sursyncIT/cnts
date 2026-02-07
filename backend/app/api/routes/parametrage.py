import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_auth_in_production
from app.db.models import ExpirationRule, UserAccount
from app.db.session import get_db
from app.schemas import parametrage as schemas

router = APIRouter()


@router.get("/regions", response_model=list[str])
def get_regions() -> list[str]:
    """
    Get list of regions (Senegal).
    """
    return [
        "Dakar",
        "Diourbel",
        "Fatick",
        "Kaffrine",
        "Kaolack",
        "Kédougou",
        "Kolda",
        "Louga",
        "Matam",
        "Saint-Louis",
        "Sédhiou",
        "Tambacounda",
        "Thiès",
        "Ziguinchor",
    ]


@router.get("/rules", response_model=list[schemas.ExpirationRule])
def read_expiration_rules(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> list[ExpirationRule]:
    """
    Retrieve expiration rules.
    """
    stmt = select(ExpirationRule).offset(skip).limit(limit)
    return list(db.execute(stmt).scalars())


@router.post("/rules", response_model=schemas.ExpirationRule)
def create_expiration_rule(
    rule_in: schemas.ExpirationRuleCreate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> ExpirationRule:
    """
    Create new expiration rule.
    """
    rule = ExpirationRule(**rule_in.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.put("/rules/{rule_id}", response_model=schemas.ExpirationRule)
def update_expiration_rule(
    rule_id: uuid.UUID,
    rule_in: schemas.ExpirationRuleUpdate,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> ExpirationRule:
    """
    Update an expiration rule.
    """
    rule = db.get(ExpirationRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)

    rule.version += 1

    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/rules/{rule_id}", response_model=schemas.ExpirationRule)
def delete_expiration_rule(
    rule_id: uuid.UUID,
    db: Session = Depends(get_db),
    _user: UserAccount | None = Depends(require_auth_in_production),
) -> ExpirationRule:
    """
    Delete an expiration rule.
    """
    rule = db.get(ExpirationRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    db.delete(rule)
    db.commit()
    return rule
