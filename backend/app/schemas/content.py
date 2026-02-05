from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ArticleStatus(str, Enum):
    DRAFT = "DRAFT"
    REVIEW = "REVIEW"
    PUBLISHED = "PUBLISHED"
    ARCHIVED = "ARCHIVED"


class ArticleBase(BaseModel):
    title: str
    slug: str
    excerpt: str | None = None
    content: str
    category: str
    image_url: str | None = None
    status: ArticleStatus = ArticleStatus.DRAFT
    tags: list[str] = []
    is_published: bool = True  # Keep for backward compatibility


class ArticleCreate(ArticleBase):
    pass


class ArticleUpdate(BaseModel):
    title: str | None = None
    slug: str | None = None
    excerpt: str | None = None
    content: str | None = None
    category: str | None = None
    image_url: str | None = None
    status: ArticleStatus | None = None
    tags: list[str] | None = None
    is_published: bool | None = None


class ArticleResponse(ArticleBase):
    id: UUID
    author_id: UUID | None = None
    published_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
