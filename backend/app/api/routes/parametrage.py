import uuid
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_db
from app.db.models import ExpirationRule
from app.schemas import parametrage as schemas

router = APIRouter()


@router.get("/regions", response_model=list[str])
async def get_regions() -> Any:
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
        "Ziguinchor"
    ]


@router.get("/rules", response_model=list[schemas.ExpirationRule])
async def read_expiration_rules(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
) -> Any:
    """
    Retrieve expiration rules.
    """
    stmt = select(ExpirationRule).offset(skip).limit(limit)
    result = await db.execute(stmt)
    rules = result.scalars().all()
    return rules


@router.post("/rules", response_model=schemas.ExpirationRule)
async def create_expiration_rule(
    *,
    db: AsyncSession = Depends(get_db),
    rule_in: schemas.ExpirationRuleCreate,
) -> Any:
    """
    Create new expiration rule.
    """
    rule = ExpirationRule(**rule_in.model_dump())
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.put("/rules/{rule_id}", response_model=schemas.ExpirationRule)
async def update_expiration_rule(
    *,
    db: AsyncSession = Depends(get_db),
    rule_id: uuid.UUID,
    rule_in: schemas.ExpirationRuleUpdate,
) -> Any:
    """
    Update an expiration rule.
    """
    rule = await db.get(ExpirationRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    update_data = rule_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(rule, field, value)
    
    # Increment version
    rule.version += 1
    
    db.add(rule)
    await db.commit()
    await db.refresh(rule)
    return rule


@router.delete("/rules/{rule_id}", response_model=schemas.ExpirationRule)
async def delete_expiration_rule(
    *,
    db: AsyncSession = Depends(get_db),
    rule_id: uuid.UUID,
) -> Any:
    """
    Delete an expiration rule (Logical delete could be implemented, here physical).
    """
    rule = await db.get(ExpirationRule, rule_id)
    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")
    
    await db.delete(rule)
    await db.commit()
    return rule
