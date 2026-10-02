"""Rendez-vous réels (lieux, créneaux, suivi par le centre) et documents déposés par le centre.

Revision ID: 0024_rdv_lieux_documents
Revises: 0023_patient_verification
"""

import uuid

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0024_rdv_lieux_documents"
down_revision = "0023_patient_verification"
branch_labels = None
depends_on = None

TZ = sa.DateTime(timezone=True)
# Horaires publiés du CNTS : lun–ven 08h–17h, sam 08h–13h (modifiables dans le back-office).
HORAIRES = {str(d): [["08:00", "17:00"]] for d in range(1, 6)} | {"6": [["08:00", "13:00"]]}
LIEUX = [
    ("SIEGE", "CNTS — Siège national (Fann, Dakar)", "Avenue Cheikh Anta Diop, Fann, Dakar"),
    ("KAOLACK", "CRTS de Kaolack", "Kaolack"),
]


def upgrade() -> None:
    lieux = op.create_table(
        "lieux_rdv",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(16), nullable=False),
        sa.Column("nom", sa.String(120), nullable=False),
        sa.Column("adresse", sa.Text(), nullable=True),
        sa.Column("actif", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("horaires", postgresql.JSONB(), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("fermetures", postgresql.JSONB(), nullable=False, server_default=sa.text("'[]'::jsonb")),
        sa.Column("duree_creneau_min", sa.Integer(), nullable=False, server_default="30"),
        sa.Column("capacite_creneau", sa.Integer(), nullable=False, server_default="3"),
        sa.Column("delai_min_heures", sa.Integer(), nullable=False, server_default="2"),
        sa.Column("horizon_jours", sa.Integer(), nullable=False, server_default="90"),
        sa.Column("created_at", TZ, server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", TZ, server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_lieux_rdv_code", "lieux_rdv", ["code"], unique=True)
    op.create_index("ix_lieux_rdv_actif", "lieux_rdv", ["actif"])
    op.bulk_insert(
        lieux,
        [{"id": uuid.uuid4(), "code": c, "nom": n, "adresse": a, "actif": True, "horaires": HORAIRES, "fermetures": []} for c, n, a in LIEUX],
    )

    op.add_column("rendez_vous", sa.Column("lieu_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("rendez_vous", sa.Column("motif", sa.String(255), nullable=True))
    op.add_column("rendez_vous", sa.Column("traite_par_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("rendez_vous", sa.Column("traite_le", TZ, nullable=True))
    op.add_column("rendez_vous", sa.Column("rappel_envoye_le", TZ, nullable=True))
    op.create_foreign_key("fk_rendez_vous_lieu", "rendez_vous", "lieux_rdv", ["lieu_id"], ["id"])
    op.create_foreign_key("fk_rendez_vous_traite_par", "rendez_vous", "user_accounts", ["traite_par_id"], ["id"])
    op.create_index("ix_rendez_vous_lieu_id", "rendez_vous", ["lieu_id"])
    op.create_index("ix_rendez_vous_lieu_creneau", "rendez_vous", ["lieu_id", "date_prevue", "statut"])

    op.alter_column("documents_medicaux", "fichier_url", server_default="")
    op.add_column("documents_medicaux", sa.Column("fichier_cle", sa.String(64), nullable=True))
    op.add_column("documents_medicaux", sa.Column("fichier_nom", sa.String(255), nullable=True))
    op.add_column("documents_medicaux", sa.Column("mime", sa.String(64), nullable=True))
    op.add_column("documents_medicaux", sa.Column("taille", sa.Integer(), nullable=True))
    op.add_column("documents_medicaux", sa.Column("ajoute_par_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_documents_medicaux_ajoute_par", "documents_medicaux", "user_accounts", ["ajoute_par_id"], ["id"]
    )


def downgrade() -> None:
    op.drop_constraint("fk_documents_medicaux_ajoute_par", "documents_medicaux", type_="foreignkey")
    for column in ("ajoute_par_id", "taille", "mime", "fichier_nom", "fichier_cle"):
        op.drop_column("documents_medicaux", column)
    op.alter_column("documents_medicaux", "fichier_url", server_default=None)
    op.drop_index("ix_rendez_vous_lieu_creneau", "rendez_vous")
    op.drop_index("ix_rendez_vous_lieu_id", "rendez_vous")
    op.drop_constraint("fk_rendez_vous_traite_par", "rendez_vous", type_="foreignkey")
    op.drop_constraint("fk_rendez_vous_lieu", "rendez_vous", type_="foreignkey")
    for column in ("rappel_envoye_le", "traite_le", "traite_par_id", "motif", "lieu_id"):
        op.drop_column("rendez_vous", column)
    op.drop_index("ix_lieux_rdv_actif", "lieux_rdv")
    op.drop_index("ix_lieux_rdv_code", "lieux_rdv")
    op.drop_table("lieux_rdv")
