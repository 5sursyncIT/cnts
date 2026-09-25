from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import FaqItem, UserAccount
from app.db.session import get_db
from app.schemas.content import FaqItemCreate, FaqItemResponse, FaqItemUpdate

router = APIRouter(prefix="/faq")


@router.get("", response_model=list[FaqItemResponse])
def list_faq(
    db: Session = Depends(get_db),
    category: str | None = None,
    published_only: bool = True,
    skip: int = 0,
    limit: int = 200,
) -> Any:
    """List FAQ items, ordered for display."""
    query = select(FaqItem)
    if published_only:
        query = query.where(FaqItem.is_published.is_(True))
    if category:
        query = query.where(FaqItem.category == category)
    query = (
        query.order_by(FaqItem.display_order.asc(), FaqItem.created_at.asc())
        .offset(skip)
        .limit(limit)
    )
    return db.execute(query).scalars().all()


@router.get("/{id}", response_model=FaqItemResponse)
def get_faq(id: UUID, db: Session = Depends(get_db)) -> Any:
    """Get a single FAQ item by id."""
    item = db.get(FaqItem, id)
    if not item:
        raise HTTPException(status_code=404, detail="FAQ item not found")
    return item


@router.post("", response_model=FaqItemResponse)
def create_faq(
    *,
    db: Session = Depends(get_db),
    item_in: FaqItemCreate,
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """Create a FAQ item."""
    item = FaqItem(**item_in.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{id}", response_model=FaqItemResponse)
def update_faq(
    *,
    db: Session = Depends(get_db),
    id: UUID,
    item_in: FaqItemUpdate,
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """Update a FAQ item."""
    item = db.get(FaqItem, id)
    if not item:
        raise HTTPException(status_code=404, detail="FAQ item not found")
    for field, value in item_in.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{id}")
def delete_faq(
    *,
    db: Session = Depends(get_db),
    id: UUID,
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """Delete a FAQ item."""
    item = db.get(FaqItem, id)
    if not item:
        raise HTTPException(status_code=404, detail="FAQ item not found")
    db.delete(item)
    db.commit()
    return {"ok": True}
