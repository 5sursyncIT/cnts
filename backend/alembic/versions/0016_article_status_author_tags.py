"""Article: real status, author_id and tags columns

Replaces the computed @property values on the Article model with persisted
columns so the editorial workflow (DRAFT/REVIEW/PUBLISHED/ARCHIVED), authorship
and tags survive a round-trip. `is_published` is kept in sync for backward
compatibility with existing published_only queries.

Revision ID: 0016_article_status_author
Revises: 0015_phase1_to_6_tables
Create Date: 2026-06-07

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "0016_article_status_author"
down_revision = "0015_phase1_to_6_tables"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "articles",
        sa.Column("status", sa.String(length=16), nullable=False, server_default="DRAFT"),
    )
    op.add_column(
        "articles",
        sa.Column(
            "tags",
            sa.JSON().with_variant(JSONB(), "postgresql"),
            nullable=False,
            server_default=sa.text("'[]'"),
        ),
    )
    op.add_column(
        "articles",
        sa.Column("author_id", UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_articles_author_id_user_accounts",
        "articles",
        "user_accounts",
        ["author_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index(op.f("ix_articles_status"), "articles", ["status"], unique=False)

    # Backfill the new status column from the legacy is_published flag.
    op.execute(
        "UPDATE articles SET status = CASE WHEN is_published THEN 'PUBLISHED' ELSE 'DRAFT' END"
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_articles_status"), table_name="articles")
    op.drop_constraint(
        "fk_articles_author_id_user_accounts", "articles", type_="foreignkey"
    )
    op.drop_column("articles", "author_id")
    op.drop_column("articles", "tags")
    op.drop_column("articles", "status")
