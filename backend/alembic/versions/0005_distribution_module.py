"""distribution: hopitaux, commandes, reservations, cross-match

Revision ID: 0005_distribution
Revises: 0004_recettes
Create Date: 2026-02-02

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0005_distribution"
down_revision = "0004_recettes"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("poches", sa.Column("groupe_sanguin", sa.String(length=8), nullable=True))
    op.create_index("ix_poches_groupe_sanguin", "poches", ["groupe_sanguin"])

    op.create_table(
        "hopitaux",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("nom", sa.String(length=200), nullable=False),
        sa.Column("adresse", sa.Text(), nullable=True),
        sa.Column("contact", sa.Text(), nullable=True),
        sa.Column("convention_actif", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("nom", name="uq_hopitaux_nom"),
    )
    op.create_index("ix_hopitaux_nom", "hopitaux", ["nom"])
    op.create_index("ix_hopitaux_convention_actif", "hopitaux", ["convention_actif"])

    op.create_table(
        "commandes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("hopital_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("hopitaux.id"), nullable=False),
        sa.Column("statut", sa.String(length=16), nullable=False),
        sa.Column("date_demande", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("date_livraison_prevue", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.CheckConstraint(
            "statut IN ('BROUILLON','VALIDEE','SERVIE','ANNULEE')",
            name="ck_commandes_statut",
        ),
    )
    op.create_index("ix_commandes_hopital_id", "commandes", ["hopital_id"])
    op.create_index("ix_commandes_statut", "commandes", ["statut"])

    op.create_table(
        "ligne_commandes",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("commande_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("commandes.id"), nullable=False),
        sa.Column("type_produit", sa.String(length=16), nullable=False),
        sa.Column("groupe_sanguin", sa.String(length=8), nullable=True),
        sa.Column("quantite", sa.Integer(), nullable=False),
    )
    op.create_index("ix_ligne_commandes_commande_id", "ligne_commandes", ["commande_id"])
    op.create_index("ix_ligne_commandes_type_produit", "ligne_commandes", ["type_produit"])
    op.create_index("ix_ligne_commandes_groupe_sanguin", "ligne_commandes", ["groupe_sanguin"])

    op.create_table(
        "reservations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("poche_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("poches.id"), nullable=False),
        sa.Column("commande_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("commandes.id"), nullable=False),
        sa.Column("date_reservation", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("released_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("poche_id", name="uq_reservations_poche_id"),
    )
    op.create_index("ix_reservations_commande_id", "reservations", ["commande_id"])
    op.create_index("ix_reservations_expires_at", "reservations", ["expires_at"])

    op.create_table(
        "receveurs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("nom", sa.String(length=200), nullable=True),
        sa.Column("groupe_sanguin", sa.String(length=8), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
    )
    op.create_index("ix_receveurs_groupe_sanguin", "receveurs", ["groupe_sanguin"])

    op.create_table(
        "cross_matches",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("poche_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("poches.id"), nullable=False),
        sa.Column("receveur_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("receveurs.id"), nullable=False),
        sa.Column("resultat", sa.String(length=16), nullable=False),
        sa.Column("validateur_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.CheckConstraint("resultat IN ('COMPATIBLE','INCOMPATIBLE')", name="ck_cross_matches_resultat"),
        sa.UniqueConstraint("poche_id", "receveur_id", name="uq_cross_matches_poche_receveur"),
    )
    op.create_index("ix_cross_matches_poche_id", "cross_matches", ["poche_id"])
    op.create_index("ix_cross_matches_receveur_id", "cross_matches", ["receveur_id"])
    op.create_index("ix_cross_matches_resultat", "cross_matches", ["resultat"])

    conn = op.get_bind()
    conn.exec_driver_sql(
        """
        CREATE OR REPLACE FUNCTION enforce_poche_distribution_rules()
        RETURNS trigger AS $$
        DECLARE don_statut text;
        BEGIN
          IF NEW.statut_distribution IN ('DISPONIBLE','RESERVE','DISTRIBUE') THEN
            SELECT statut_qualification INTO don_statut FROM dons WHERE id = NEW.don_id;
            IF don_statut IS NULL OR don_statut <> 'LIBERE' THEN
              RAISE EXCEPTION USING MESSAGE =
                'Impossible de changer statut_distribution: don ' || NEW.don_id || ' non LIBERE (statut=' || COALESCE(don_statut, 'NULL') || ')';
            END IF;
          END IF;

          IF NEW.statut_distribution = 'DISTRIBUE' AND (OLD.statut_distribution IS DISTINCT FROM 'RESERVE') THEN
            RAISE EXCEPTION USING MESSAGE =
              'Transition interdite: ' || COALESCE(OLD.statut_distribution, 'NULL') || ' -> DISTRIBUE (poche=' || NEW.id || ')';
          END IF;

          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    conn.exec_driver_sql(
        """
        DROP TRIGGER IF EXISTS trg_enforce_poche_distribution_rules ON poches;
        CREATE TRIGGER trg_enforce_poche_distribution_rules
        BEFORE UPDATE OF statut_distribution ON poches
        FOR EACH ROW
        EXECUTE FUNCTION enforce_poche_distribution_rules();
        """
    )


def downgrade() -> None:
    conn = op.get_bind()
    conn.exec_driver_sql("DROP TRIGGER IF EXISTS trg_enforce_poche_distribution_rules ON poches;")
    conn.exec_driver_sql("DROP FUNCTION IF EXISTS enforce_poche_distribution_rules();")

    op.drop_index("ix_cross_matches_resultat", table_name="cross_matches")
    op.drop_index("ix_cross_matches_receveur_id", table_name="cross_matches")
    op.drop_index("ix_cross_matches_poche_id", table_name="cross_matches")
    op.drop_table("cross_matches")

    op.drop_index("ix_receveurs_groupe_sanguin", table_name="receveurs")
    op.drop_table("receveurs")

    op.drop_index("ix_reservations_expires_at", table_name="reservations")
    op.drop_index("ix_reservations_commande_id", table_name="reservations")
    op.drop_table("reservations")

    op.drop_index("ix_ligne_commandes_groupe_sanguin", table_name="ligne_commandes")
    op.drop_index("ix_ligne_commandes_type_produit", table_name="ligne_commandes")
    op.drop_index("ix_ligne_commandes_commande_id", table_name="ligne_commandes")
    op.drop_table("ligne_commandes")

    op.drop_index("ix_commandes_statut", table_name="commandes")
    op.drop_index("ix_commandes_hopital_id", table_name="commandes")
    op.drop_table("commandes")

    op.drop_index("ix_hopitaux_convention_actif", table_name="hopitaux")
    op.drop_index("ix_hopitaux_nom", table_name="hopitaux")
    op.drop_table("hopitaux")

    op.drop_index("ix_poches_groupe_sanguin", table_name="poches")
    op.drop_column("poches", "groupe_sanguin")
