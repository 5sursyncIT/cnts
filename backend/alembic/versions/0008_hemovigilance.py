"""hemovigilance: transfusions and recalls

Revision ID: 0008_hemovigilance
Revises: 0007_poche_isbt
Create Date: 2026-02-03

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0008_hemovigilance"
down_revision = "0007_poche_isbt"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "actes_transfusionnels",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("poche_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("poches.id"), nullable=False),
        sa.Column("commande_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("commandes.id"), nullable=True),
        sa.Column("hopital_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hopitaux.id"), nullable=True),
        sa.Column("receveur_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("receveurs.id"), nullable=True),
        sa.Column("date_transfusion", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("validateur_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("poche_id", name="uq_actes_transfusionnels_poche_id"),
    )
    op.create_index("ix_actes_transfusionnels_poche_id", "actes_transfusionnels", ["poche_id"])
    op.create_index("ix_actes_transfusionnels_commande_id", "actes_transfusionnels", ["commande_id"])
    op.create_index("ix_actes_transfusionnels_hopital_id", "actes_transfusionnels", ["hopital_id"])
    op.create_index("ix_actes_transfusionnels_receveur_id", "actes_transfusionnels", ["receveur_id"])
    op.create_index("ix_actes_transfusionnels_date_transfusion", "actes_transfusionnels", ["date_transfusion"])

    op.create_table(
        "rappels",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("type_cible", sa.String(length=16), nullable=False),
        sa.Column("valeur_cible", sa.String(length=64), nullable=False),
        sa.Column("motif", sa.Text(), nullable=True),
        sa.Column("statut", sa.String(length=16), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.CheckConstraint("type_cible IN ('DIN','LOT')", name="ck_rappels_type_cible"),
        sa.CheckConstraint("statut IN ('OUVERT','CLOTURE')", name="ck_rappels_statut"),
    )
    op.create_index("ix_rappels_type_cible", "rappels", ["type_cible"])
    op.create_index("ix_rappels_valeur_cible", "rappels", ["valeur_cible"])
    op.create_index("ix_rappels_statut", "rappels", ["statut"])


def downgrade() -> None:
    op.drop_index("ix_rappels_statut", table_name="rappels")
    op.drop_index("ix_rappels_valeur_cible", table_name="rappels")
    op.drop_index("ix_rappels_type_cible", table_name="rappels")
    op.drop_table("rappels")

    op.drop_index("ix_actes_transfusionnels_date_transfusion", table_name="actes_transfusionnels")
    op.drop_index("ix_actes_transfusionnels_receveur_id", table_name="actes_transfusionnels")
    op.drop_index("ix_actes_transfusionnels_hopital_id", table_name="actes_transfusionnels")
    op.drop_index("ix_actes_transfusionnels_commande_id", table_name="actes_transfusionnels")
    op.drop_index("ix_actes_transfusionnels_poche_id", table_name="actes_transfusionnels")
    op.drop_table("actes_transfusionnels")
