"""Remove plaintext CNI storage for GDPR compliance

This migration removes the 'cni' column from the donneurs table.
The CNI should only be stored as a hash (cni_hash) for privacy reasons.

Revision ID: remove_cni_plaintext
Revises: ed7185b7458a
Create Date: 2026-02-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'remove_cni_plaintext'
down_revision: Union[str, None] = 'ed7185b7458a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Remove plaintext CNI column - data is already hashed in cni_hash."""
    op.drop_column('donneurs', 'cni')


def downgrade() -> None:
    """Re-add CNI column (will be empty - original data is lost)."""
    op.add_column('donneurs', sa.Column('cni', sa.String(64), nullable=True))
