"""add_indexes_for_filtering

Revision ID: b16e41cf02c6
Revises: 1a385b40d921
Create Date: 2026-02-03 16:13:41.658857

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = 'b16e41cf02c6'
down_revision = '1a385b40d921'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(op.f('ix_donneurs_region'), 'donneurs', ['region'], unique=False)
    op.create_index(op.f('ix_donneurs_groupe_sanguin'), 'donneurs', ['groupe_sanguin'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_donneurs_groupe_sanguin'), table_name='donneurs')
    op.drop_index(op.f('ix_donneurs_region'), table_name='donneurs')
