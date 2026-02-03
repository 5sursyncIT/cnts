"""reservations: liaison ligne et receveur

Revision ID: 0006_reservations_lr
Revises: 0005_distribution
Create Date: 2026-02-02

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0006_reservations_lr"
down_revision = "0005_distribution"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("reservations", sa.Column("ligne_commande_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("reservations", sa.Column("receveur_id", postgresql.UUID(as_uuid=True), nullable=True))

    op.create_index("ix_reservations_ligne_commande_id", "reservations", ["ligne_commande_id"])
    op.create_index("ix_reservations_receveur_id", "reservations", ["receveur_id"])

    op.create_foreign_key(
        "fk_reservations_ligne_commande_id",
        "reservations",
        "ligne_commandes",
        ["ligne_commande_id"],
        ["id"],
    )
    op.create_foreign_key(
        "fk_reservations_receveur_id",
        "reservations",
        "receveurs",
        ["receveur_id"],
        ["id"],
    )


def downgrade() -> None:
    op.drop_constraint("fk_reservations_receveur_id", "reservations", type_="foreignkey")
    op.drop_constraint("fk_reservations_ligne_commande_id", "reservations", type_="foreignkey")
    op.drop_index("ix_reservations_receveur_id", table_name="reservations")
    op.drop_index("ix_reservations_ligne_commande_id", table_name="reservations")
    op.drop_column("reservations", "receveur_id")
    op.drop_column("reservations", "ligne_commande_id")
