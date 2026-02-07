"""add isbt_product_code to product_rules

Revision ID: 0013_product_rule_isbt_code
Revises: 0012_cold_chain
Create Date: 2026-02-07

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0013_product_rule_isbt_code"
down_revision = "0012_cold_chain"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "product_rules",
        sa.Column("isbt_product_code", sa.String(16), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("product_rules", "isbt_product_code")
