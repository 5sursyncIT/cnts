"""hemovigilance: recall workflow and actions

Revision ID: 0009_rappel_workflow
Revises: 0008_hemovigilance
Create Date: 2026-02-03

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0009_rappel_workflow"
down_revision = "0008_hemovigilance"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "rappels",
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.add_column("rappels", sa.Column("notified_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("rappels", sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("rappels", sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True))

    op.drop_constraint("ck_rappels_statut", "rappels", type_="check")
    op.create_check_constraint(
        "ck_rappels_statut",
        "rappels",
        "statut IN ('OUVERT','NOTIFIE','CONFIRME','CLOTURE')",
    )

    op.create_table(
        "rappel_actions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("rappel_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("rappels.id"), nullable=False),
        sa.Column("action", sa.String(length=16), nullable=False),
        sa.Column("validateur_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.CheckConstraint(
            "action IN ('CREER','NOTIFIER','CONFIRMER','CLOTURER')",
            name="ck_rappel_actions_action",
        ),
    )
    op.create_index("ix_rappel_actions_rappel_id", "rappel_actions", ["rappel_id"])
    op.create_index("ix_rappel_actions_action", "rappel_actions", ["action"])


def downgrade() -> None:
    op.drop_index("ix_rappel_actions_action", table_name="rappel_actions")
    op.drop_index("ix_rappel_actions_rappel_id", table_name="rappel_actions")
    op.drop_table("rappel_actions")

    op.drop_constraint("ck_rappels_statut", "rappels", type_="check")
    op.create_check_constraint("ck_rappels_statut", "rappels", "statut IN ('OUVERT','CLOTURE')")

    op.drop_column("rappels", "closed_at")
    op.drop_column("rappels", "confirmed_at")
    op.drop_column("rappels", "notified_at")
    op.drop_column("rappels", "updated_at")
