"""Add extended fields to receveur

Revision ID: d563798ae98f
Revises: b16e41cf02c6
Create Date: 2026-02-03 17:08:58.353414

"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = 'd563798ae98f'
down_revision = 'b16e41cf02c6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add new columns to receveurs table
    op.add_column('receveurs', sa.Column('prenom', sa.String(length=200), nullable=True))
    op.add_column('receveurs', sa.Column('sexe', sa.String(length=1), nullable=True))
    op.add_column('receveurs', sa.Column('date_naissance', sa.Date(), nullable=True))
    op.add_column('receveurs', sa.Column('adresse', sa.Text(), nullable=True))
    op.add_column('receveurs', sa.Column('telephone', sa.String(length=32), nullable=True))


def downgrade() -> None:
    # Remove added columns
    op.drop_column('receveurs', 'telephone')
    op.drop_column('receveurs', 'adresse')
    op.drop_column('receveurs', 'date_naissance')
    op.drop_column('receveurs', 'sexe')
    op.drop_column('receveurs', 'prenom')
