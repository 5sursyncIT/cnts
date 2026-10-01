from datetime import datetime, timezone
from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user_optional, require_staff
from app.db.models import Article, UserAccount
from app.db.session import get_db
from app.schemas.content import ArticleCreate, ArticleResponse, ArticleUpdate

router = APIRouter(prefix="/articles")


@router.get("", response_model=list[ArticleResponse])
def get_articles(
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 100,
    category: str | None = None,
    status: str | None = None,
    published_only: bool = True,
    current_user: UserAccount | None = Depends(get_current_user_optional),
) -> Any:
    """
    Retrieve articles.
    """
    if (status and status != "PUBLISHED") or not published_only:
        if current_user is None or (current_user.role or "").upper() == "PATIENT":
            raise HTTPException(status_code=403, detail="Accès réservé au personnel")
    query = select(Article)

    if status:
        query = query.where(Article.status == status)
    elif published_only:
        query = query.where(Article.status == "PUBLISHED")

    if category:
        query = query.where(Article.category == category)

    query = query.order_by(Article.published_at.desc()).offset(skip).limit(limit)
    articles = db.execute(query).scalars().all()
    return articles


@router.get("/{slug}", response_model=ArticleResponse)
def get_article(
    slug: str,
    db: Session = Depends(get_db),
    current_user: UserAccount | None = Depends(get_current_user_optional),
) -> Any:
    """
    Get article by slug.
    """
    article = db.execute(select(Article).where(Article.slug == slug)).scalar_one_or_none()
    if not article or (
        article.status != "PUBLISHED"
        and (current_user is None or (current_user.role or "").upper() == "PATIENT")
    ):
        raise HTTPException(status_code=404, detail="Article not found")
    return article


@router.post("", response_model=ArticleResponse)
def create_article(
    *,
    db: Session = Depends(get_db),
    article_in: ArticleCreate,
    current_user: UserAccount = Depends(require_staff),
) -> Any:
    """
    Create new article.
    """
    payload = article_in.model_dump()
    status_value = payload.get("status") or "DRAFT"
    payload["status"] = status_value
    payload["is_published"] = status_value == "PUBLISHED"
    payload["author_id"] = current_user.id
    article = Article(**payload)
    db.add(article)
    db.commit()
    db.refresh(article)
    return article


@router.put("/{id}", response_model=ArticleResponse)
def update_article(
    *,
    db: Session = Depends(get_db),
    id: UUID,
    article_in: ArticleUpdate,
    current_user: UserAccount = Depends(require_staff),
) -> Any:
    """
    Update an article.
    """
    article = db.get(Article, id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    update_data = article_in.model_dump(exclude_unset=True)
    new_status = update_data.get("status")
    if new_status is not None:
        # Stamp the publication date the first time an article goes live.
        if new_status == "PUBLISHED" and not article.is_published:
            article.published_at = datetime.now(timezone.utc)
        update_data["is_published"] = new_status == "PUBLISHED"
    for field, value in update_data.items():
        setattr(article, field, value)

    db.add(article)
    db.commit()
    db.refresh(article)
    return article


@router.delete("/{id}")
def delete_article(
    *,
    db: Session = Depends(get_db),
    id: UUID,
    current_user: UserAccount = Depends(require_staff),
) -> Any:
    """
    Delete an article.
    """
    article = db.get(Article, id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    db.delete(article)
    db.commit()
    return {"ok": True}
