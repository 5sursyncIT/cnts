"""Vérification des comptes patients : email confirmé et code SMS au téléphone du dossier.

Revision ID: 0023_patient_verification
Revises: 0022_auth_lockout_mfa_replay
"""

import sqlalchemy as sa

from alembic import op

revision = "0023_patient_verification"
down_revision = "0022_auth_lockout_mfa_replay"
branch_labels = None
depends_on = None

TZ = sa.DateTime(timezone=True)


def upgrade() -> None:
    op.add_column("user_accounts", sa.Column("email_verified_at", TZ, nullable=True))
    op.add_column("user_accounts", sa.Column("phone_verified_at", TZ, nullable=True))
    op.add_column("user_accounts", sa.Column("otp_hash", sa.String(64), nullable=True))
    op.add_column("user_accounts", sa.Column("otp_expires_at", TZ, nullable=True))
    op.add_column(
        "user_accounts", sa.Column("otp_attempts", sa.Integer(), nullable=False, server_default="0")
    )
    op.add_column("user_accounts", sa.Column("otp_last_sent_at", TZ, nullable=True))
    op.add_column(
        "user_accounts", sa.Column("otp_sends_today", sa.Integer(), nullable=False, server_default="0")
    )
    # Comptes existants (créés par un administrateur) : considérés comme confirmés.
    op.execute("UPDATE user_accounts SET email_verified_at = now()")


def downgrade() -> None:
    for column in (
        "otp_sends_today",
        "otp_last_sent_at",
        "otp_attempts",
        "otp_expires_at",
        "otp_hash",
        "phone_verified_at",
        "email_verified_at",
    ):
        op.drop_column("user_accounts", column)
