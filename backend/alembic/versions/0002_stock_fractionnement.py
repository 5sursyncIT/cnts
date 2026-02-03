"""stock fractionnement + events

Revision ID: 0002_stock_fractionnement
Revises: 0001_init
Create Date: 2026-02-02

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0002_stock_fractionnement"
down_revision = "0001_init"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "poches",
        sa.Column("source_poche_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_index("ix_poches_source_poche_id", "poches", ["source_poche_id"])
    op.create_foreign_key(
        "fk_poches_source_poche_id",
        "poches",
        "poches",
        ["source_poche_id"],
        ["id"],
    )

    op.add_column("poches", sa.Column("volume_ml", sa.Integer(), nullable=True))

    op.add_column(
        "poches",
        sa.Column("statut_stock", sa.String(length=32), nullable=False, server_default="EN_STOCK"),
    )
    op.create_index("ix_poches_statut_stock", "poches", ["statut_stock"])
    op.alter_column("poches", "statut_stock", server_default=None)

    op.create_table(
        "trace_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("aggregate_type", sa.String(length=32), nullable=False),
        sa.Column("aggregate_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_trace_events_aggregate_type", "trace_events", ["aggregate_type"])
    op.create_index("ix_trace_events_aggregate_id", "trace_events", ["aggregate_id"])
    op.create_index("ix_trace_events_event_type", "trace_events", ["event_type"])


def downgrade() -> None:
    op.drop_index("ix_trace_events_event_type", table_name="trace_events")
    op.drop_index("ix_trace_events_aggregate_id", table_name="trace_events")
    op.drop_index("ix_trace_events_aggregate_type", table_name="trace_events")
    op.drop_table("trace_events")

    op.drop_index("ix_poches_statut_stock", table_name="poches")
    op.drop_column("poches", "statut_stock")

    op.drop_column("poches", "volume_ml")

    op.drop_constraint("fk_poches_source_poche_id", "poches", type_="foreignkey")
    op.drop_index("ix_poches_source_poche_id", table_name="poches")
    op.drop_column("poches", "source_poche_id")
