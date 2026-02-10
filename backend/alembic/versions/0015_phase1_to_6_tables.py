"""add all Phase 1-6 tables (tasks, notifications, sites, clinical safety, operations, quality, integrations, billing, consumables, recruitment)

Revision ID: 0015_phase1_to_6_tables
Revises: 0014_cartes_donneur
Create Date: 2026-02-09

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects.postgresql import JSONB, UUID

revision = "0015_phase1_to_6_tables"
down_revision = "0014_cartes_donneur"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Phase 1.1: Background Tasks ──
    op.create_table(
        "task_results",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("task_id", sa.String(255), unique=True, index=True, nullable=False),
        sa.Column("task_name", sa.String(128), index=True, nullable=False),
        sa.Column("status", sa.String(16), index=True, nullable=False, server_default="PENDING"),
        sa.Column("result_json", JSONB, nullable=True),
        sa.Column("error_message", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # ── Phase 1.2: Notifications ──
    op.create_table(
        "notifications",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("canal", sa.String(16), index=True, nullable=False),
        sa.Column("destinataire", sa.String(320), index=True, nullable=False),
        sa.Column("template", sa.String(64), index=True, nullable=False),
        sa.Column("variables", JSONB, nullable=False),
        sa.Column("statut", sa.String(16), index=True, nullable=False, server_default="EN_ATTENTE"),
        sa.Column("priorite", sa.String(16), nullable=False, server_default="NORMALE"),
        sa.Column("tentatives", sa.Integer, nullable=False, server_default="0"),
        sa.Column("erreur", sa.Text, nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "notification_preferences",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("user_accounts.id"), unique=True, index=True, nullable=False),
        sa.Column("email_enabled", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("sms_enabled", sa.Boolean, nullable=False, server_default="true"),
        sa.Column("whatsapp_enabled", sa.Boolean, nullable=False, server_default="false"),
    )

    # ── Phase 1.3: Multi-Sites ── (must come before tables that reference sites)
    op.create_table(
        "sites",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(16), unique=True, index=True, nullable=False),
        sa.Column("nom", sa.String(200), nullable=False),
        sa.Column("type_site", sa.String(32), index=True, nullable=False),
        sa.Column("adresse", sa.Text, nullable=True),
        sa.Column("region", sa.String(64), nullable=True),
        sa.Column("telephone", sa.String(32), nullable=True),
        sa.Column("email", sa.String(120), nullable=True),
        sa.Column("responsable_nom", sa.String(200), nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true", index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "transferts_inter_sites",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("site_source_id", UUID(as_uuid=True), sa.ForeignKey("sites.id"), index=True, nullable=False),
        sa.Column("site_destination_id", UUID(as_uuid=True), sa.ForeignKey("sites.id"), index=True, nullable=False),
        sa.Column("statut", sa.String(32), index=True, nullable=False, server_default="BROUILLON"),
        sa.Column("motif", sa.Text, nullable=True),
        sa.Column("date_expedition", sa.DateTime(timezone=True), nullable=True),
        sa.Column("date_reception", sa.DateTime(timezone=True), nullable=True),
        sa.Column("transporteur", sa.String(200), nullable=True),
        sa.Column("temperature_depart", sa.Float, nullable=True),
        sa.Column("temperature_arrivee", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "ligne_transferts",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("transfert_id", UUID(as_uuid=True), sa.ForeignKey("transferts_inter_sites.id"), index=True, nullable=False),
        sa.Column("poche_id", UUID(as_uuid=True), sa.ForeignKey("poches.id"), index=True, nullable=False),
        sa.Column("statut_reception", sa.String(16), nullable=True),
        sa.Column("note", sa.Text, nullable=True),
    )

    # ── Phase 2.1: Phenotypage ──
    op.create_table(
        "phenotypages",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("donneur_id", UUID(as_uuid=True), sa.ForeignKey("donneurs.id"), index=True, nullable=False),
        sa.Column("don_id", UUID(as_uuid=True), sa.ForeignKey("dons.id"), nullable=True, index=True),
        sa.Column("systeme", sa.String(16), index=True, nullable=False),
        sa.Column("antigenes", JSONB, nullable=False),
        sa.Column("phenotype_complet", sa.String(120), nullable=True),
        sa.Column("methode", sa.String(64), nullable=True),
        sa.Column("validateur_id", UUID(as_uuid=True), nullable=True),
        sa.Column("is_confirmed", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("donneur_id", "systeme", name="uq_phenotypage_donneur_systeme"),
    )

    op.create_table(
        "registre_groupes_rares",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("donneur_id", UUID(as_uuid=True), sa.ForeignKey("donneurs.id"), unique=True, index=True, nullable=False),
        sa.Column("phenotype_resume", sa.String(255), nullable=False),
        sa.Column("rarete", sa.String(16), index=True, nullable=False),
        sa.Column("note_clinique", sa.Text, nullable=True),
        sa.Column("dernier_contact", sa.Date, nullable=True),
        sa.Column("disponible", sa.Boolean, nullable=False, server_default="true", index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 2.2: RAI ──
    op.create_table(
        "rai_tests",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("receveur_id", UUID(as_uuid=True), sa.ForeignKey("receveurs.id"), index=True, nullable=False),
        sa.Column("commande_id", UUID(as_uuid=True), sa.ForeignKey("commandes.id"), nullable=True, index=True),
        sa.Column("date_prelevement", sa.DateTime(timezone=True), nullable=False),
        sa.Column("resultat", sa.String(16), index=True, nullable=False, server_default="EN_ATTENTE"),
        sa.Column("anticorps_identifies", JSONB, nullable=True),
        sa.Column("validite_heures", sa.Integer, nullable=False, server_default="72"),
        sa.Column("validateur_id", UUID(as_uuid=True), nullable=True),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 2.3: Tests NAT ──
    op.create_table(
        "tests_nat",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("don_id", UUID(as_uuid=True), sa.ForeignKey("dons.id"), index=True, nullable=False),
        sa.Column("type_test", sa.String(16), index=True, nullable=False),
        sa.Column("resultat_qualitatif", sa.String(16), index=True, nullable=False, server_default="EN_ATTENTE"),
        sa.Column("charge_virale", sa.Float, nullable=True),
        sa.Column("unite", sa.String(32), nullable=True),
        sa.Column("seuil_detection", sa.Float, nullable=True),
        sa.Column("lot_reactif", sa.String(64), nullable=True),
        sa.Column("automate_id", sa.String(64), nullable=True),
        sa.Column("validateur_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 2.4: Reactions Adverses Donneur ──
    op.create_table(
        "reactions_adverses_donneurs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("don_id", UUID(as_uuid=True), sa.ForeignKey("dons.id"), index=True, nullable=False),
        sa.Column("donneur_id", UUID(as_uuid=True), sa.ForeignKey("donneurs.id"), index=True, nullable=False),
        sa.Column("type_reaction", sa.String(32), index=True, nullable=False),
        sa.Column("gravite", sa.String(16), index=True, nullable=False),
        sa.Column("moment", sa.String(16), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("prise_en_charge", sa.Text, nullable=True),
        sa.Column("evolution", sa.String(16), index=True, nullable=False, server_default="EN_COURS"),
        sa.Column("declarant_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 2.5: CULM ──
    op.create_table(
        "culm",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("poche_id", UUID(as_uuid=True), sa.ForeignKey("poches.id"), index=True, nullable=False),
        sa.Column("receveur_id", UUID(as_uuid=True), sa.ForeignKey("receveurs.id"), index=True, nullable=False),
        sa.Column("commande_id", UUID(as_uuid=True), sa.ForeignKey("commandes.id"), nullable=True, index=True),
        sa.Column("identite_patient_verifiee", sa.Boolean, nullable=False),
        sa.Column("groupe_patient_controle", sa.String(8), nullable=True),
        sa.Column("groupe_poche_controle", sa.String(8), nullable=True),
        sa.Column("concordance_abo", sa.Boolean, nullable=False),
        sa.Column("beth_vincent", sa.String(32), nullable=True),
        sa.Column("simonin", sa.String(32), nullable=True),
        sa.Column("resultat", sa.String(16), index=True, nullable=False),
        sa.Column("motif_non_conformite", sa.Text, nullable=True),
        sa.Column("temperature", sa.Float, nullable=True),
        sa.Column("tension_systolique", sa.Integer, nullable=True),
        sa.Column("tension_diastolique", sa.Integer, nullable=True),
        sa.Column("frequence_cardiaque", sa.Integer, nullable=True),
        sa.Column("operateur_id", UUID(as_uuid=True), nullable=True),
        sa.Column("lieu", sa.String(200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 2.6: Suivi Per-Transfusionnel ──
    op.create_table(
        "suivis_per_transfusionnels",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("acte_transfusionnel_id", UUID(as_uuid=True), sa.ForeignKey("actes_transfusionnels.id"), index=True, nullable=False),
        sa.Column("moment", sa.String(16), nullable=False),
        sa.Column("temperature", sa.Float, nullable=True),
        sa.Column("tension_systolique", sa.Integer, nullable=True),
        sa.Column("tension_diastolique", sa.Integer, nullable=True),
        sa.Column("frequence_cardiaque", sa.Integer, nullable=True),
        sa.Column("frequence_respiratoire", sa.Integer, nullable=True),
        sa.Column("saturation_o2", sa.Float, nullable=True),
        sa.Column("debit_ml_h", sa.Integer, nullable=True),
        sa.Column("observation", sa.Text, nullable=True),
        sa.Column("alerte", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("operateur_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 2.7: EIR ──
    op.create_table(
        "eir",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("acte_transfusionnel_id", UUID(as_uuid=True), sa.ForeignKey("actes_transfusionnels.id"), index=True, nullable=False),
        sa.Column("receveur_id", UUID(as_uuid=True), sa.ForeignKey("receveurs.id"), index=True, nullable=False),
        sa.Column("poche_id", UUID(as_uuid=True), sa.ForeignKey("poches.id"), index=True, nullable=False),
        sa.Column("type_eir", sa.String(32), index=True, nullable=False),
        sa.Column("gravite", sa.String(16), index=True, nullable=False),
        sa.Column("imputabilite", sa.String(16), index=True, nullable=False),
        sa.Column("delai_apparition_minutes", sa.Integer, nullable=True),
        sa.Column("symptomes", sa.Text, nullable=True),
        sa.Column("conduite_tenue", sa.Text, nullable=True),
        sa.Column("evolution", sa.String(32), index=True, nullable=False, server_default="EN_COURS"),
        sa.Column("declarant_id", UUID(as_uuid=True), nullable=True),
        sa.Column("date_declaration", sa.DateTime(timezone=True), nullable=True),
        sa.Column("statut_investigation", sa.String(16), index=True, nullable=False, server_default="OUVERTE"),
        sa.Column("conclusion", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 2.8: Apherese ──
    op.create_table(
        "procedures_apherese",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("don_id", UUID(as_uuid=True), sa.ForeignKey("dons.id"), unique=True, index=True, nullable=False),
        sa.Column("donneur_id", UUID(as_uuid=True), sa.ForeignKey("donneurs.id"), index=True, nullable=False),
        sa.Column("type_apherese", sa.String(32), index=True, nullable=False),
        sa.Column("automate", sa.String(120), nullable=True),
        sa.Column("duree_minutes", sa.Integer, nullable=True),
        sa.Column("volume_preleve_ml", sa.Integer, nullable=True),
        sa.Column("volume_restitue_ml", sa.Integer, nullable=True),
        sa.Column("anticoagulant", sa.String(64), nullable=True),
        sa.Column("nb_cycles", sa.Integer, nullable=True),
        sa.Column("operateur_id", UUID(as_uuid=True), nullable=True),
        sa.Column("statut", sa.String(16), index=True, nullable=False, server_default="EN_COURS"),
        sa.Column("motif_interruption", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 3.1: Collectes Mobiles ──
    op.create_table(
        "campagnes_collecte",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(32), unique=True, index=True, nullable=False),
        sa.Column("nom", sa.String(200), nullable=False),
        sa.Column("site_id", UUID(as_uuid=True), sa.ForeignKey("sites.id"), nullable=True, index=True),
        sa.Column("type_campagne", sa.String(32), index=True, nullable=False),
        sa.Column("lieu", sa.String(200), nullable=True),
        sa.Column("adresse", sa.Text, nullable=True),
        sa.Column("latitude", sa.Float, nullable=True),
        sa.Column("longitude", sa.Float, nullable=True),
        sa.Column("date_debut", sa.DateTime(timezone=True), nullable=False),
        sa.Column("date_fin", sa.DateTime(timezone=True), nullable=False),
        sa.Column("objectif_dons", sa.Integer, nullable=True),
        sa.Column("statut", sa.String(16), index=True, nullable=False, server_default="PLANIFIEE"),
        sa.Column("responsable_id", UUID(as_uuid=True), nullable=True),
        sa.Column("materiel_notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "inscriptions_collecte",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("campagne_id", UUID(as_uuid=True), sa.ForeignKey("campagnes_collecte.id"), index=True, nullable=False),
        sa.Column("donneur_id", UUID(as_uuid=True), sa.ForeignKey("donneurs.id"), nullable=True, index=True),
        sa.Column("nom", sa.String(200), nullable=True),
        sa.Column("telephone", sa.String(32), nullable=True),
        sa.Column("creneau", sa.DateTime(timezone=True), nullable=True),
        sa.Column("statut", sa.String(16), index=True, nullable=False, server_default="INSCRIT"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 3.2: Prevision de Stock ──
    op.create_table(
        "previsions_stock",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("type_produit", sa.String(16), index=True, nullable=False),
        sa.Column("groupe_sanguin", sa.String(8), nullable=True, index=True),
        sa.Column("site_id", UUID(as_uuid=True), sa.ForeignKey("sites.id"), nullable=True, index=True),
        sa.Column("date_prevision", sa.Date, index=True, nullable=False),
        sa.Column("quantite_prevue", sa.Integer, nullable=False),
        sa.Column("quantite_reelle", sa.Integer, nullable=True),
        sa.Column("methode", sa.String(32), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "seuils_alerte",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("type_produit", sa.String(16), index=True, nullable=False),
        sa.Column("groupe_sanguin", sa.String(8), nullable=True, index=True),
        sa.Column("site_id", UUID(as_uuid=True), sa.ForeignKey("sites.id"), nullable=True, index=True),
        sa.Column("seuil_critique", sa.Integer, nullable=False),
        sa.Column("seuil_alerte", sa.Integer, nullable=False),
        sa.Column("seuil_confort", sa.Integer, nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true", index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 3.3: Transport et Logistique ──
    op.create_table(
        "livraisons",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("commande_id", UUID(as_uuid=True), sa.ForeignKey("commandes.id"), nullable=True, index=True),
        sa.Column("transfert_id", UUID(as_uuid=True), sa.ForeignKey("transferts_inter_sites.id"), nullable=True, index=True),
        sa.Column("hopital_id", UUID(as_uuid=True), sa.ForeignKey("hopitaux.id"), nullable=True, index=True),
        sa.Column("statut", sa.String(16), index=True, nullable=False, server_default="PREPAREE"),
        sa.Column("transporteur_nom", sa.String(200), nullable=True),
        sa.Column("vehicule", sa.String(64), nullable=True),
        sa.Column("temperature_depart", sa.Float, nullable=True),
        sa.Column("temperature_arrivee", sa.Float, nullable=True),
        sa.Column("heure_depart", sa.DateTime(timezone=True), nullable=True),
        sa.Column("heure_arrivee", sa.DateTime(timezone=True), nullable=True),
        sa.Column("signe_par", sa.String(200), nullable=True),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "releves_temperature_transport",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("livraison_id", UUID(as_uuid=True), sa.ForeignKey("livraisons.id"), index=True, nullable=False),
        sa.Column("temperature_c", sa.Float, nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), index=True, nullable=False),
        sa.Column("latitude", sa.Float, nullable=True),
        sa.Column("longitude", sa.Float, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 4.1: SMQ ──
    op.create_table(
        "documents_qualite",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(32), unique=True, index=True, nullable=False),
        sa.Column("titre", sa.String(200), nullable=False),
        sa.Column("type_document", sa.String(32), index=True, nullable=False),
        sa.Column("version", sa.String(16), nullable=False, server_default="1.0"),
        sa.Column("statut", sa.String(16), index=True, nullable=False, server_default="BROUILLON"),
        sa.Column("fichier_url", sa.String(500), nullable=True),
        sa.Column("redacteur_id", UUID(as_uuid=True), nullable=True),
        sa.Column("verificateur_id", UUID(as_uuid=True), nullable=True),
        sa.Column("approbateur_id", UUID(as_uuid=True), nullable=True),
        sa.Column("date_approbation", sa.Date, nullable=True),
        sa.Column("date_revision", sa.Date, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "non_conformites",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(32), unique=True, index=True, nullable=False),
        sa.Column("titre", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("type_nc", sa.String(16), index=True, nullable=False),
        sa.Column("gravite", sa.String(16), index=True, nullable=False),
        sa.Column("statut", sa.String(32), index=True, nullable=False, server_default="OUVERTE"),
        sa.Column("detecteur_id", UUID(as_uuid=True), nullable=True),
        sa.Column("responsable_id", UUID(as_uuid=True), nullable=True),
        sa.Column("cause_racine", sa.Text, nullable=True),
        sa.Column("action_immediate", sa.Text, nullable=True),
        sa.Column("action_corrective", sa.Text, nullable=True),
        sa.Column("date_cloture", sa.Date, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "capa",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(32), unique=True, index=True, nullable=False),
        sa.Column("non_conformite_id", UUID(as_uuid=True), sa.ForeignKey("non_conformites.id"), nullable=True, index=True),
        sa.Column("type_action", sa.String(16), index=True, nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("responsable_id", UUID(as_uuid=True), nullable=True),
        sa.Column("date_echeance", sa.Date, nullable=True),
        sa.Column("statut", sa.String(16), index=True, nullable=False, server_default="PLANIFIEE"),
        sa.Column("verification", sa.Text, nullable=True),
        sa.Column("efficacite", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "audits_internes",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(32), unique=True, index=True, nullable=False),
        sa.Column("titre", sa.String(200), nullable=False),
        sa.Column("processus_audite", sa.String(120), nullable=True),
        sa.Column("date_audit", sa.Date, nullable=True),
        sa.Column("auditeur_id", UUID(as_uuid=True), nullable=True),
        sa.Column("statut", sa.String(16), index=True, nullable=False, server_default="PLANIFIE"),
        sa.Column("constats", JSONB, nullable=True),
        sa.Column("conclusion", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 4.2: Equipements ──
    op.create_table(
        "equipements",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("code_inventaire", sa.String(32), unique=True, index=True, nullable=False),
        sa.Column("nom", sa.String(200), nullable=False),
        sa.Column("categorie", sa.String(32), index=True, nullable=False),
        sa.Column("marque", sa.String(120), nullable=True),
        sa.Column("modele", sa.String(120), nullable=True),
        sa.Column("numero_serie", sa.String(64), nullable=True),
        sa.Column("site_id", UUID(as_uuid=True), sa.ForeignKey("sites.id"), nullable=True, index=True),
        sa.Column("localisation", sa.String(120), nullable=True),
        sa.Column("date_mise_service", sa.Date, nullable=True),
        sa.Column("date_prochaine_maintenance", sa.Date, nullable=True, index=True),
        sa.Column("date_prochaine_calibration", sa.Date, nullable=True, index=True),
        sa.Column("statut", sa.String(16), index=True, nullable=False, server_default="EN_SERVICE"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "interventions_equipement",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("equipement_id", UUID(as_uuid=True), sa.ForeignKey("equipements.id"), index=True, nullable=False),
        sa.Column("type_intervention", sa.String(32), index=True, nullable=False),
        sa.Column("date_intervention", sa.Date, nullable=False),
        sa.Column("technicien", sa.String(200), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("resultat", sa.String(16), index=True, nullable=False),
        sa.Column("prochaine_date", sa.Date, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 4.3: Formations et Habilitations ──
    op.create_table(
        "formations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(32), unique=True, index=True, nullable=False),
        sa.Column("titre", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("categorie", sa.String(64), nullable=True, index=True),
        sa.Column("duree_heures", sa.Integer, nullable=True),
        sa.Column("periodicite_mois", sa.Integer, nullable=True),
        sa.Column("is_obligatoire", sa.Boolean, nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "habilitations",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", UUID(as_uuid=True), sa.ForeignKey("user_accounts.id"), index=True, nullable=False),
        sa.Column("formation_id", UUID(as_uuid=True), sa.ForeignKey("formations.id"), index=True, nullable=False),
        sa.Column("date_obtention", sa.Date, nullable=False),
        sa.Column("date_expiration", sa.Date, nullable=True, index=True),
        sa.Column("statut", sa.String(16), index=True, nullable=False, server_default="VALIDE"),
        sa.Column("formateur", sa.String(200), nullable=True),
        sa.Column("note", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 5.1: Automates ──
    op.create_table(
        "interfaces_automates",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(32), unique=True, index=True, nullable=False),
        sa.Column("nom", sa.String(200), nullable=False),
        sa.Column("type_automate", sa.String(64), nullable=True),
        sa.Column("protocole", sa.String(16), index=True, nullable=False),
        sa.Column("host", sa.String(200), nullable=True),
        sa.Column("port", sa.Integer, nullable=True),
        sa.Column("mapping_config", JSONB, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true", index=True),
        sa.Column("last_communication", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "messages_automates",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("interface_id", UUID(as_uuid=True), sa.ForeignKey("interfaces_automates.id"), index=True, nullable=False),
        sa.Column("direction", sa.String(16), index=True, nullable=False),
        sa.Column("contenu_brut", sa.Text, nullable=True),
        sa.Column("statut", sa.String(16), index=True, nullable=False, server_default="RECU"),
        sa.Column("erreur", sa.Text, nullable=True),
        sa.Column("analyse_id", UUID(as_uuid=True), sa.ForeignKey("analyses.id"), nullable=True, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 5.3: DHIS2 ──
    op.create_table(
        "dhis2_exports",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("periode", sa.String(16), index=True, nullable=False),
        sa.Column("org_unit", sa.String(64), nullable=False),
        sa.Column("data_set", sa.String(64), nullable=True),
        sa.Column("payload", JSONB, nullable=False),
        sa.Column("statut", sa.String(16), index=True, nullable=False, server_default="EN_ATTENTE"),
        sa.Column("response_code", sa.Integer, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 6.1: Facturation ──
    op.create_table(
        "tarifs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("type_produit", sa.String(16), index=True, nullable=False),
        sa.Column("prix_unitaire_fcfa", sa.Integer, nullable=False),
        sa.Column("date_debut", sa.Date, nullable=False),
        sa.Column("date_fin", sa.Date, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true", index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "factures",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("numero", sa.String(32), unique=True, index=True, nullable=False),
        sa.Column("commande_id", UUID(as_uuid=True), sa.ForeignKey("commandes.id"), nullable=True, index=True),
        sa.Column("hopital_id", UUID(as_uuid=True), sa.ForeignKey("hopitaux.id"), index=True, nullable=False),
        sa.Column("date_facture", sa.Date, nullable=False),
        sa.Column("montant_ht_fcfa", sa.Integer, nullable=False),
        sa.Column("montant_ttc_fcfa", sa.Integer, nullable=False),
        sa.Column("statut", sa.String(32), index=True, nullable=False, server_default="EMISE"),
        sa.Column("date_echeance", sa.Date, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "lignes_facture",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("facture_id", UUID(as_uuid=True), sa.ForeignKey("factures.id"), index=True, nullable=False),
        sa.Column("type_produit", sa.String(16), nullable=False),
        sa.Column("quantite", sa.Integer, nullable=False),
        sa.Column("prix_unitaire_fcfa", sa.Integer, nullable=False),
        sa.Column("montant_fcfa", sa.Integer, nullable=False),
    )

    op.create_table(
        "paiements",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("facture_id", UUID(as_uuid=True), sa.ForeignKey("factures.id"), index=True, nullable=False),
        sa.Column("montant_fcfa", sa.Integer, nullable=False),
        sa.Column("mode_paiement", sa.String(16), nullable=False),
        sa.Column("reference", sa.String(64), nullable=True),
        sa.Column("date_paiement", sa.Date, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 6.2: Consommables ──
    op.create_table(
        "consommables",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("code", sa.String(32), unique=True, index=True, nullable=False),
        sa.Column("designation", sa.String(200), nullable=False),
        sa.Column("categorie", sa.String(32), index=True, nullable=False),
        sa.Column("unite", sa.String(16), nullable=False),
        sa.Column("seuil_alerte", sa.Integer, nullable=True),
        sa.Column("seuil_critique", sa.Integer, nullable=True),
        sa.Column("fournisseur", sa.String(200), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "lots_consommable",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("consommable_id", UUID(as_uuid=True), sa.ForeignKey("consommables.id"), index=True, nullable=False),
        sa.Column("numero_lot", sa.String(64), index=True, nullable=False),
        sa.Column("date_reception", sa.Date, nullable=False),
        sa.Column("date_peremption", sa.Date, nullable=True, index=True),
        sa.Column("quantite_recue", sa.Integer, nullable=False),
        sa.Column("quantite_restante", sa.Integer, nullable=False),
        sa.Column("fournisseur", sa.String(200), nullable=True),
        sa.Column("certificat_url", sa.String(500), nullable=True),
        sa.Column("site_id", UUID(as_uuid=True), sa.ForeignKey("sites.id"), nullable=True, index=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "mouvements_consommable",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("lot_id", UUID(as_uuid=True), sa.ForeignKey("lots_consommable.id"), index=True, nullable=False),
        sa.Column("type_mouvement", sa.String(16), index=True, nullable=False),
        sa.Column("quantite", sa.Integer, nullable=False),
        sa.Column("motif", sa.String(200), nullable=True),
        sa.Column("operateur_id", UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # ── Phase 6.3: Campagnes Recrutement ──
    # (cartes_donneur and points_historique already in 0014)
    op.create_table(
        "campagnes_recrutement",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("nom", sa.String(200), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("date_debut", sa.Date, nullable=False),
        sa.Column("date_fin", sa.Date, nullable=True),
        sa.Column("cible", sa.String(200), nullable=True),
        sa.Column("canal", sa.String(16), nullable=False),
        sa.Column("message_template", sa.Text, nullable=True),
        sa.Column("statut", sa.String(16), index=True, nullable=False, server_default="PLANIFIEE"),
        sa.Column("nb_contactes", sa.Integer, nullable=False, server_default="0"),
        sa.Column("nb_convertis", sa.Integer, nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    # Drop in reverse order of creation to respect FK constraints
    op.drop_table("campagnes_recrutement")
    op.drop_table("mouvements_consommable")
    op.drop_table("lots_consommable")
    op.drop_table("consommables")
    op.drop_table("paiements")
    op.drop_table("lignes_facture")
    op.drop_table("factures")
    op.drop_table("tarifs")
    op.drop_table("dhis2_exports")
    op.drop_table("messages_automates")
    op.drop_table("interfaces_automates")
    op.drop_table("habilitations")
    op.drop_table("formations")
    op.drop_table("interventions_equipement")
    op.drop_table("equipements")
    op.drop_table("audits_internes")
    op.drop_table("capa")
    op.drop_table("non_conformites")
    op.drop_table("documents_qualite")
    op.drop_table("releves_temperature_transport")
    op.drop_table("livraisons")
    op.drop_table("seuils_alerte")
    op.drop_table("previsions_stock")
    op.drop_table("inscriptions_collecte")
    op.drop_table("campagnes_collecte")
    op.drop_table("procedures_apherese")
    op.drop_table("eir")
    op.drop_table("suivis_per_transfusionnels")
    op.drop_table("culm")
    op.drop_table("reactions_adverses_donneurs")
    op.drop_table("tests_nat")
    op.drop_table("rai_tests")
    op.drop_table("registre_groupes_rares")
    op.drop_table("phenotypages")
    op.drop_table("ligne_transferts")
    op.drop_table("transferts_inter_sites")
    op.drop_table("sites")
    op.drop_table("notification_preferences")
    op.drop_table("notifications")
    op.drop_table("task_results")
