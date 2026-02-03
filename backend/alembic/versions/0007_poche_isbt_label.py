"""poche: isbt128 label fields

Revision ID: 0007_poche_isbt
Revises: 0006_reservations_lr
Create Date: 2026-02-03

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0007_poche_isbt"
down_revision = "0006_reservations_lr"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("poches", sa.Column("code_produit_isbt", sa.String(length=32), nullable=True))
    op.add_column("poches", sa.Column("lot", sa.String(length=32), nullable=True))
    op.add_column("poches", sa.Column("division", sa.Integer(), nullable=True))

    op.create_index("ix_poches_code_produit_isbt", "poches", ["code_produit_isbt"])
    op.create_index("ix_poches_lot", "poches", ["lot"])


def downgrade() -> None:
    op.drop_index("ix_poches_lot", table_name="poches")
    op.drop_index("ix_poches_code_produit_isbt", table_name="poches")
    op.drop_column("poches", "division")
    op.drop_column("poches", "lot")
    op.drop_column("poches", "code_produit_isbt")
