"""Add contact_messages table

Messages envoyés depuis le formulaire de contact du portail public, consultés
dans le Back Office.

Revision ID: 0020_contact_messages
Revises: 0019_donneur_soft_delete
Create Date: 2026-09-25

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "0020_contact_messages"
down_revision = "0019_donneur_soft_delete"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "contact_messages",
        sa.Column("id", UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=254), nullable=False),
        sa.Column("phone", sa.String(length=40), nullable=True),
        sa.Column("subject", sa.String(length=200), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False, server_default="NOUVEAU"),
        sa.Column("client_ip", sa.String(length=64), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_contact_messages_status"), "contact_messages", ["status"])
    op.create_index(op.f("ix_contact_messages_client_ip"), "contact_messages", ["client_ip"])
    op.create_index(op.f("ix_contact_messages_created_at"), "contact_messages", ["created_at"])


def downgrade() -> None:
    op.drop_index(op.f("ix_contact_messages_created_at"), table_name="contact_messages")
    op.drop_index(op.f("ix_contact_messages_client_ip"), table_name="contact_messages")
    op.drop_index(op.f("ix_contact_messages_status"), table_name="contact_messages")
    op.drop_table("contact_messages")
