"""fractionnement recettes

Revision ID: 0004_recettes
Revises: 0003_prod_rules
Create Date: 2026-02-02

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0004_recettes"
down_revision = "0003_prod_rules"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "fractionnement_recettes",
        sa.Column("code", sa.String(length=32), primary_key=True, nullable=False),
        sa.Column("libelle", sa.String(length=120), nullable=False),
        sa.Column("actif", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("site_code", sa.String(length=32), nullable=True),
        sa.Column("type_source", sa.String(length=16), nullable=False, server_default=sa.text("'ST'")),
        sa.Column("composants", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_fractionnement_recettes_actif", "fractionnement_recettes", ["actif"])
    op.create_index("ix_fractionnement_recettes_site_code", "fractionnement_recettes", ["site_code"])

    conn = op.get_bind()
    conn.exec_driver_sql(
        """
        INSERT INTO fractionnement_recettes (code, libelle, actif, site_code, type_source, composants)
        VALUES
          (
            'ST_STANDARD',
            'ST -> 1 CGR + 1 PFC + 1 CP',
            true,
            NULL,
            'ST',
            '[{"type_produit":"CGR","quantite":1},{"type_produit":"PFC","quantite":1},{"type_produit":"CP","quantite":1}]'::jsonb
          )
        ON CONFLICT (code) DO NOTHING
        """
    )


def downgrade() -> None:
    op.drop_index("ix_fractionnement_recettes_site_code", table_name="fractionnement_recettes")
    op.drop_index("ix_fractionnement_recettes_actif", table_name="fractionnement_recettes")
    op.drop_table("fractionnement_recettes")
