"""cold chain storages and readings

Revision ID: 0012_cold_chain
Revises: remove_cni_plaintext
Create Date: 2026-02-05

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0012_cold_chain"
down_revision = "remove_cni_plaintext"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "cold_chain_storages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("code", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("location", sa.String(length=200), nullable=True),
        sa.Column("min_temp", sa.Float(), nullable=False),
        sa.Column("max_temp", sa.Float(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code", name="uq_cold_chain_storages_code"),
    )
    op.create_index("ix_cold_chain_storages_code", "cold_chain_storages", ["code"])
    op.create_index("ix_cold_chain_storages_is_active", "cold_chain_storages", ["is_active"])

    op.create_table(
        "cold_chain_readings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("storage_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("temperature_c", sa.Float(), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("source", sa.String(length=32), nullable=True),
        sa.Column("note", sa.String(length=200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.ForeignKeyConstraint(["storage_id"], ["cold_chain_storages.id"], name="fk_cold_chain_readings_storage"),
    )
    op.create_index("ix_cold_chain_readings_storage_id", "cold_chain_readings", ["storage_id"])
    op.create_index("ix_cold_chain_readings_recorded_at", "cold_chain_readings", ["recorded_at"])


def downgrade() -> None:
    op.drop_index("ix_cold_chain_readings_recorded_at", table_name="cold_chain_readings")
    op.drop_index("ix_cold_chain_readings_storage_id", table_name="cold_chain_readings")
    op.drop_table("cold_chain_readings")

    op.drop_index("ix_cold_chain_storages_is_active", table_name="cold_chain_storages")
    op.drop_index("ix_cold_chain_storages_code", table_name="cold_chain_storages")
    op.drop_table("cold_chain_storages")
