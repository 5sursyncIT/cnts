"""add cartes_donneur and points_historique tables

Revision ID: 0014_cartes_donneur
Revises: 0013_product_rule_isbt_code
Create Date: 2026-02-09

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import UUID

revision = "0014_cartes_donneur"
down_revision = "0013_product_rule_isbt_code"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "cartes_donneur",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("donneur_id", UUID(as_uuid=True), sa.ForeignKey("donneurs.id"), unique=True, nullable=False),
        sa.Column("numero_carte", sa.String(32), unique=True, nullable=False),
        sa.Column("qr_code_data", sa.String(500), nullable=True),
        sa.Column("niveau", sa.String(16), nullable=False, server_default="BRONZE"),
        sa.Column("points", sa.Integer, nullable=False, server_default="0"),
        sa.Column("total_dons", sa.Integer, nullable=False, server_default="0"),
        sa.Column("date_premier_don", sa.Date, nullable=True),
        sa.Column("date_dernier_don", sa.Date, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_cartes_donneur_donneur_id", "cartes_donneur", ["donneur_id"])
    op.create_index("ix_cartes_donneur_numero_carte", "cartes_donneur", ["numero_carte"], unique=True)
    op.create_index("ix_cartes_donneur_niveau", "cartes_donneur", ["niveau"])
    op.create_index("ix_cartes_donneur_is_active", "cartes_donneur", ["is_active"])

    op.create_table(
        "points_historique",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("carte_id", UUID(as_uuid=True), sa.ForeignKey("cartes_donneur.id"), nullable=False),
        sa.Column("type_operation", sa.String(32), nullable=False),
        sa.Column("points", sa.Integer, nullable=False),
        sa.Column("description", sa.String(255), nullable=True),
        sa.Column("reference_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_points_historique_carte_id", "points_historique", ["carte_id"])


def downgrade() -> None:
    op.drop_table("points_historique")
    op.drop_table("cartes_donneur")
