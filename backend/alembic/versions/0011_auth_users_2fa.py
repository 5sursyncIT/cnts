"""auth users + 2fa fields

Revision ID: 0011_auth_users_2fa
Revises: 0010_sync_offline
Create Date: 2026-02-03

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0011_auth_users_2fa"
down_revision = "0010_sync_offline"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "user_accounts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("email", sa.String(length=320), nullable=False),
        sa.Column("password_hash", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("mfa_enabled", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("mfa_secret", sa.Text(), nullable=True),
        sa.Column("mfa_enabled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("mfa_disabled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("email", name="uq_user_accounts_email"),
    )
    op.create_index("ix_user_accounts_email", "user_accounts", ["email"])
    op.create_index("ix_user_accounts_is_active", "user_accounts", ["is_active"])
    op.create_index("ix_user_accounts_mfa_enabled", "user_accounts", ["mfa_enabled"])

    op.create_table(
        "user_recovery_codes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("user_accounts.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("code_hash", sa.Text(), nullable=False),
        sa.Column("used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_user_recovery_codes_user_id", "user_recovery_codes", ["user_id"])
    op.create_index("ix_user_recovery_codes_code_hash", "user_recovery_codes", ["code_hash"])
    op.create_index("ix_user_recovery_codes_used_at", "user_recovery_codes", ["used_at"])


def downgrade() -> None:
    op.drop_index("ix_user_recovery_codes_used_at", table_name="user_recovery_codes")
    op.drop_index("ix_user_recovery_codes_code_hash", table_name="user_recovery_codes")
    op.drop_index("ix_user_recovery_codes_user_id", table_name="user_recovery_codes")
    op.drop_table("user_recovery_codes")

    op.drop_index("ix_user_accounts_mfa_enabled", table_name="user_accounts")
    op.drop_index("ix_user_accounts_is_active", table_name="user_accounts")
    op.drop_index("ix_user_accounts_email", table_name="user_accounts")
    op.drop_table("user_accounts")

