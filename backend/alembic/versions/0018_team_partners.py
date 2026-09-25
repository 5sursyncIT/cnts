"""Add team_members and partners tables

Editable team members and partners managed from the Back Office CMS and rendered
on the public portal (/equipe and /qui-sommes-nous/partenaires).

Revision ID: 0018_team_partners
Revises: 0017_faq_items
Create Date: 2026-06-07

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "0018_team_partners"
down_revision = "0017_faq_items"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "team_members",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("role", sa.String(length=150), nullable=False),
        sa.Column("specialty", sa.String(length=150), nullable=True),
        sa.Column("bio", sa.Text(), nullable=True),
        sa.Column("photo_url", sa.String(length=500), nullable=True),
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
    op.create_index(
        op.f("ix_team_members_display_order"), "team_members", ["display_order"], unique=False
    )
    op.create_index(
        op.f("ix_team_members_is_published"), "team_members", ["is_published"], unique=False
    )

    op.create_table(
        "partners",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "category", sa.String(length=80), nullable=False, server_default="Institutionnel"
        ),
        sa.Column("type", sa.String(length=80), nullable=True),
        sa.Column("logo_url", sa.String(length=500), nullable=True),
        sa.Column("website_url", sa.String(length=500), nullable=True),
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
    op.create_index(op.f("ix_partners_category"), "partners", ["category"], unique=False)
    op.create_index(
        op.f("ix_partners_display_order"), "partners", ["display_order"], unique=False
    )
    op.create_index(
        op.f("ix_partners_is_published"), "partners", ["is_published"], unique=False
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_partners_is_published"), table_name="partners")
    op.drop_index(op.f("ix_partners_display_order"), table_name="partners")
    op.drop_index(op.f("ix_partners_category"), table_name="partners")
    op.drop_table("partners")
    op.drop_index(op.f("ix_team_members_is_published"), table_name="team_members")
    op.drop_index(op.f("ix_team_members_display_order"), table_name="team_members")
    op.drop_table("team_members")
