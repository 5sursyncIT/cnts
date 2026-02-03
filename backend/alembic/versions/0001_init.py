"""init schema

Revision ID: 0001_init
Revises: 
Create Date: 2026-02-02

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0001_init"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(sa.text("CREATE SEQUENCE IF NOT EXISTS din_seq START WITH 1 INCREMENT BY 1"))

    op.create_table(
        "donneurs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("cni_hash", sa.String(length=128), nullable=False),
        sa.Column("nom", sa.String(length=120), nullable=False),
        sa.Column("prenom", sa.String(length=120), nullable=False),
        sa.Column("sexe", sa.String(length=1), nullable=False),
        sa.Column("dernier_don", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("cni_hash", name="uq_donneurs_cni_hash"),
    )
    op.create_index("ix_donneurs_cni_hash", "donneurs", ["cni_hash"])

    op.create_table(
        "dons",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("donneur_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("donneurs.id"), nullable=False),
        sa.Column("din", sa.String(length=32), nullable=False),
        sa.Column("date_don", sa.Date(), nullable=False),
        sa.Column("type_don", sa.String(length=32), nullable=False),
        sa.Column("statut_qualification", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("din", name="uq_dons_din"),
    )
    op.create_index("ix_dons_donneur_id", "dons", ["donneur_id"])
    op.create_index("ix_dons_din", "dons", ["din"])
    op.create_index("ix_dons_statut_qualification", "dons", ["statut_qualification"])

    op.create_table(
        "poches",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("don_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dons.id"), nullable=False),
        sa.Column("type_produit", sa.String(length=16), nullable=False),
        sa.Column("date_peremption", sa.Date(), nullable=False),
        sa.Column("emplacement_stock", sa.String(length=64), nullable=False),
        sa.Column("statut_distribution", sa.String(length=32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_poches_don_id", "poches", ["don_id"])
    op.create_index("ix_poches_type_produit", "poches", ["type_produit"])
    op.create_index("ix_poches_date_peremption", "poches", ["date_peremption"])
    op.create_index("ix_poches_emplacement_stock", "poches", ["emplacement_stock"])
    op.create_index("ix_poches_statut_distribution", "poches", ["statut_distribution"])

    op.create_table(
        "analyses",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("don_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("dons.id"), nullable=False),
        sa.Column("type_test", sa.String(length=32), nullable=False),
        sa.Column("resultat", sa.String(length=32), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("validateur_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_analyses_don_id", "analyses", ["don_id"])
    op.create_index("ix_analyses_type_test", "analyses", ["type_test"])
    op.create_index("ix_analyses_resultat", "analyses", ["resultat"])

    op.create_table(
        "idempotency_keys",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("scope", sa.String(length=64), nullable=False),
        sa.Column("key", sa.String(length=128), nullable=False),
        sa.Column("request_hash", sa.String(length=64), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False),
        sa.Column("response_json", postgresql.JSONB(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("scope", "key", name="uq_idempotency_scope_key"),
    )
    op.create_index("ix_idempotency_scope_key", "idempotency_keys", ["scope", "key"])


def downgrade() -> None:
    op.drop_index("ix_idempotency_scope_key", table_name="idempotency_keys")
    op.drop_table("idempotency_keys")

    op.drop_index("ix_analyses_resultat", table_name="analyses")
    op.drop_index("ix_analyses_type_test", table_name="analyses")
    op.drop_index("ix_analyses_don_id", table_name="analyses")
    op.drop_table("analyses")

    op.drop_index("ix_poches_statut_distribution", table_name="poches")
    op.drop_index("ix_poches_emplacement_stock", table_name="poches")
    op.drop_index("ix_poches_date_peremption", table_name="poches")
    op.drop_index("ix_poches_type_produit", table_name="poches")
    op.drop_index("ix_poches_don_id", table_name="poches")
    op.drop_table("poches")

    op.drop_index("ix_dons_statut_qualification", table_name="dons")
    op.drop_index("ix_dons_din", table_name="dons")
    op.drop_index("ix_dons_donneur_id", table_name="dons")
    op.drop_table("dons")

    op.drop_index("ix_donneurs_cni_hash", table_name="donneurs")
    op.drop_table("donneurs")

    op.execute(sa.text("DROP SEQUENCE IF EXISTS din_seq"))
