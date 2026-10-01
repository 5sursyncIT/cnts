"""Verrouillage de compte, anti-rejeu TOTP et révocation des jetons à la déconnexion.

Revision ID: 0022_auth_lockout_mfa_replay
Revises: 0021_active_reservation_unique
"""

import sqlalchemy as sa

from alembic import op

revision = "0022_auth_lockout_mfa_replay"
down_revision = "0021_active_reservation_unique"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("user_accounts", sa.Column("mfa_last_step", sa.BigInteger(), nullable=True))
    op.add_column(
        "user_accounts",
        sa.Column("failed_auth_attempts", sa.Integer(), nullable=False, server_default="0"),
    )
    op.add_column(
        "user_accounts", sa.Column("locked_until", sa.DateTime(timezone=True), nullable=True)
    )
    op.add_column(
        "user_accounts",
        sa.Column("tokens_valid_after", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("user_accounts", "tokens_valid_after")
    op.drop_column("user_accounts", "locked_until")
    op.drop_column("user_accounts", "failed_auth_attempts")
    op.drop_column("user_accounts", "mfa_last_step")
