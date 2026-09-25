"""Add deleted_at to donneurs (soft delete)

Suppression logique des donneurs : un donneur supprimé est conservé en base
(deleted_at != NULL) pour préserver la traçabilité de ses dons (hémovigilance),
mais masqué des listes et recherches.

Revision ID: 0019_donneur_soft_delete
Revises: 0018_team_partners
Create Date: 2026-06-07

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0019_donneur_soft_delete"
down_revision = "0018_team_partners"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "donneurs",
        sa.Column("deleted_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index(
        "ix_donneurs_deleted_at", "donneurs", ["deleted_at"], unique=False
    )


def downgrade() -> None:
    op.drop_index("ix_donneurs_deleted_at", table_name="donneurs")
    op.drop_column("donneurs", "deleted_at")
