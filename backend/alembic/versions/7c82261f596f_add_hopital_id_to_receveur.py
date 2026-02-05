"""Add hopital_id to receveur

Revision ID: 7c82261f596f
Revises: d563798ae98f
Create Date: 2026-02-03 17:13:49.304611

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = '7c82261f596f'
down_revision = 'd563798ae98f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add hopital_id column to receveurs table
    op.add_column('receveurs', sa.Column('hopital_id', sa.UUID(), nullable=True))
    op.create_foreign_key('fk_receveurs_hopital_id', 'receveurs', 'hopitaux', ['hopital_id'], ['id'])
    op.create_index(op.f('ix_receveurs_hopital_id'), 'receveurs', ['hopital_id'], unique=False)


def downgrade() -> None:
    # Remove hopital_id column
    op.drop_index(op.f('ix_receveurs_hopital_id'), table_name='receveurs')
    op.drop_constraint('fk_receveurs_hopital_id', 'receveurs', type_='foreignkey')
    op.drop_column('receveurs', 'hopital_id')
