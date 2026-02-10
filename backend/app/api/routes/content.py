from typing import Any
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
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
) -> Any:
    """
    Retrieve articles.
    """
    query = select(Article)
    
    if published_only:
        query = query.where(Article.is_published.is_(True))
    elif status:
        query = query.where(Article.is_published.is_(status == "PUBLISHED"))
        
    if category:
        query = query.where(Article.category == category)
        
    query = query.order_by(Article.published_at.desc()).offset(skip).limit(limit)
    articles = db.execute(query).scalars().all()
    return articles


@router.get("/{slug}", response_model=ArticleResponse)
def get_article(slug: str, db: Session = Depends(get_db)) -> Any:
    """
    Get article by slug.
    """
    article = db.execute(select(Article).where(Article.slug == slug)).scalar_one_or_none()
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
    return article


@router.post("", response_model=ArticleResponse)
def create_article(
    *,
    db: Session = Depends(get_db),
    article_in: ArticleCreate,
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """
    Create new article.
    """
    payload = article_in.model_dump()
    status = payload.pop("status", None)
    payload.pop("tags", None)
    if status is not None:
        payload["is_published"] = status == "PUBLISHED"
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
    current_user: UserAccount = Depends(get_current_user),
) -> Any:
    """
    Update an article.
    """
    article = db.get(Article, id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")
        
    update_data = article_in.model_dump(exclude_unset=True)
    status = update_data.pop("status", None)
    update_data.pop("tags", None)
    if status is not None:
        update_data["is_published"] = status == "PUBLISHED"
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
    current_user: UserAccount = Depends(get_current_user),
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
