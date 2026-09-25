"""Add FAQ items table

Editable Foire Aux Questions entries managed from the Back Office CMS and
rendered on the public portal /faq page.

Revision ID: 0017_faq_items
Revises: 0016_article_status_author
Create Date: 2026-06-07

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "0017_faq_items"
down_revision = "0016_article_status_author"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "faq_items",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("question", sa.String(length=300), nullable=False),
        sa.Column("answer", sa.Text(), nullable=False),
        sa.Column(
            "category", sa.String(length=80), nullable=False, server_default="Général"
        ),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "is_published", sa.Boolean(), nullable=False, server_default=sa.text("true")
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_faq_items_category"), "faq_items", ["category"], unique=False)
    op.create_index(
        op.f("ix_faq_items_display_order"), "faq_items", ["display_order"], unique=False
    )
    op.create_index(
        op.f("ix_faq_items_is_published"), "faq_items", ["is_published"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_faq_items_is_published"), table_name="faq_items")
    op.drop_index(op.f("ix_faq_items_display_order"), table_name="faq_items")
    op.drop_index(op.f("ix_faq_items_category"), table_name="faq_items")
    op.drop_table("faq_items")
