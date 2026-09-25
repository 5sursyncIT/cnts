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


class FaqItemBase(BaseModel):
    question: str
    answer: str
    category: str = "Général"
    display_order: int = 0
    is_published: bool = True


class FaqItemCreate(FaqItemBase):
    pass


class FaqItemUpdate(BaseModel):
    question: str | None = None
    answer: str | None = None
    category: str | None = None
    display_order: int | None = None
    is_published: bool | None = None


class FaqItemResponse(FaqItemBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TeamMemberBase(BaseModel):
    name: str
    role: str
    specialty: str | None = None
    bio: str | None = None
    photo_url: str | None = None
    display_order: int = 0
    is_published: bool = True


class TeamMemberCreate(TeamMemberBase):
    pass


class TeamMemberUpdate(BaseModel):
    name: str | None = None
    role: str | None = None
    specialty: str | None = None
    bio: str | None = None
    photo_url: str | None = None
    display_order: int | None = None
    is_published: bool | None = None


class TeamMemberResponse(TeamMemberBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PartnerBase(BaseModel):
    name: str
    description: str | None = None
    category: str = "Institutionnel"
    type: str | None = None
    logo_url: str | None = None
    website_url: str | None = None
    display_order: int = 0
    is_published: bool = True


class PartnerCreate(PartnerBase):
    pass


class PartnerUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    type: str | None = None
    logo_url: str | None = None
    website_url: str | None = None
    display_order: int | None = None
    is_published: bool | None = None


class PartnerResponse(PartnerBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
