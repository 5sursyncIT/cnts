"""product rules + constraints

Revision ID: 0003_prod_rules
Revises: 0002_stock_fractionnement
Create Date: 2026-02-02

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0003_prod_rules"
down_revision = "0002_stock_fractionnement"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "product_rules",
        sa.Column("type_produit", sa.String(length=16), primary_key=True, nullable=False),
        sa.Column("shelf_life_days", sa.Integer(), nullable=False),
        sa.Column("default_volume_ml", sa.Integer(), nullable=True),
        sa.Column("min_volume_ml", sa.Integer(), nullable=True),
        sa.Column("max_volume_ml", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )

    op.execute(
        sa.text(
            """
            INSERT INTO product_rules (type_produit, shelf_life_days, default_volume_ml, min_volume_ml, max_volume_ml)
            VALUES
              ('ST', 35, 450, 350, 550),
              ('CGR', 42, 280, 200, 400),
              ('PFC', 365, 200, 120, 400),
              ('CP', 5, 60, 40, 120)
            ON CONFLICT (type_produit) DO NOTHING
            """
        )
    )

    op.create_check_constraint(
        "ck_poches_statut_stock",
        "poches",
        "statut_stock IN ('EN_STOCK','FRACTIONNEE','RESERVEE','DISTRIBUEE','DETRUITE','BLOQUEE')",
    )
    op.create_check_constraint(
        "ck_poches_statut_distribution",
        "poches",
        "statut_distribution IN ('NON_DISTRIBUABLE','DISPONIBLE','RESERVE','DISTRIBUE')",
    )


def downgrade() -> None:
    op.drop_constraint("ck_poches_statut_distribution", "poches", type_="check")
    op.drop_constraint("ck_poches_statut_stock", "poches", type_="check")
    op.drop_table("product_rules")
