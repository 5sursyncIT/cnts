"""Allow re-reservation after release while preventing two active reservations.

Revision ID: 0021_active_reservation_unique
Revises: 0020_contact_messages
"""

import sqlalchemy as sa
from alembic import op

revision = "0021_active_reservation_unique"
down_revision = "0020_contact_messages"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("ix_reservations_poche_id", table_name="reservations")
    op.create_index("ix_reservations_poche_id", "reservations", ["poche_id"])
    op.create_index(
        "uq_reservations_active_poche_id", "reservations", ["poche_id"],
        unique=True, postgresql_where=sa.text("released_at IS NULL"),
    )


def downgrade() -> None:
    raise RuntimeError(
        "Downgrade impossible sans supprimer l'historique des réservations réutilisées"
    )
