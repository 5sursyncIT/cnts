import uuid

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Donneur(Base):
    __tablename__ = "donneurs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cni_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    # CNI is NOT stored in plaintext for privacy/GDPR compliance
    # Only the hash is kept for duplicate detection and lookup
    nom: Mapped[str] = mapped_column(String(120))
    prenom: Mapped[str] = mapped_column(String(120))
    sexe: Mapped[str] = mapped_column(String(1))
    date_naissance: Mapped[Date | None] = mapped_column(Date, nullable=True)
    groupe_sanguin: Mapped[str | None] = mapped_column(String(8), nullable=True)
    adresse: Mapped[str | None] = mapped_column(String(255), nullable=True)
    region: Mapped[str | None] = mapped_column(String(64), nullable=True)
    departement: Mapped[str | None] = mapped_column(String(64), nullable=True)
    telephone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    email: Mapped[str | None] = mapped_column(String(120), nullable=True)
    profession: Mapped[str | None] = mapped_column(String(120), nullable=True)
    dernier_don: Mapped[Date | None] = mapped_column(Date, nullable=True)
    
    # Link to UserAccount for patient access
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("user_accounts.id"), nullable=True, index=True)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    dons: Mapped[list["Don"]] = relationship(back_populates="donneur")
    user: Mapped["UserAccount"] = relationship(back_populates="donneur")
    rendez_vous: Mapped[list["RendezVous"]] = relationship(back_populates="donneur")
    documents: Mapped[list["DocumentMedical"]] = relationship(back_populates="donneur")
    carte_donneur: Mapped["CarteDonneur | None"] = relationship(back_populates="donneur", uselist=False)

    @property
    def numero_carte(self) -> str | None:
        try:
            if self.carte_donneur is not None:
                return self.carte_donneur.numero_carte
        except Exception:
            pass
        return None


class ExpirationRule(Base):
    __tablename__ = "expiration_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_type: Mapped[str] = mapped_column(String(32), index=True)
    preservation_type: Mapped[str] = mapped_column(String(32))  # REFRIGERATED, FROZEN, AMBIENT
    min_temp: Mapped[float] = mapped_column(Float)
    max_temp: Mapped[float] = mapped_column(Float)
    shelf_life_value: Mapped[int] = mapped_column(Integer)
    shelf_life_unit: Mapped[str] = mapped_column(String(16))  # HOURS, DAYS, MONTHS, YEARS
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    
    modified_by: Mapped[str | None] = mapped_column(String(128), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class Don(Base):
    __tablename__ = "dons"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donneur_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("donneurs.id"), index=True)

    din: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    date_don: Mapped[Date] = mapped_column(Date)
    type_don: Mapped[str] = mapped_column(String(32))
    statut_qualification: Mapped[str] = mapped_column(String(32), index=True, default="EN_ATTENTE")

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    donneur: Mapped["Donneur"] = relationship(back_populates="dons")
    analyses: Mapped[list["Analyse"]] = relationship(back_populates="don")
    poches: Mapped[list["Poche"]] = relationship(back_populates="don")


class Poche(Base):
    __tablename__ = "poches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    don_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dons.id"), index=True)
    source_poche_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("poches.id"), index=True, nullable=True
    )

    type_produit: Mapped[str] = mapped_column(String(16), index=True)
    groupe_sanguin: Mapped[str | None] = mapped_column(String(8), index=True, nullable=True)
    code_produit_isbt: Mapped[str | None] = mapped_column(String(32), index=True, nullable=True)
    lot: Mapped[str | None] = mapped_column(String(32), index=True, nullable=True)
    division: Mapped[int | None] = mapped_column(Integer, nullable=True)
    volume_ml: Mapped[int | None] = mapped_column(Integer, nullable=True)
    date_peremption: Mapped[Date] = mapped_column(Date, index=True)
    emplacement_stock: Mapped[str] = mapped_column(String(64), index=True)
    statut_stock: Mapped[str] = mapped_column(String(32), index=True, default="EN_STOCK")
    statut_distribution: Mapped[str] = mapped_column(String(32), index=True, default="NON_DISTRIBUABLE")

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    don: Mapped["Don"] = relationship(back_populates="poches")


class Analyse(Base):
    __tablename__ = "analyses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    don_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dons.id"), index=True)

    type_test: Mapped[str] = mapped_column(String(32), index=True)
    resultat: Mapped[str] = mapped_column(String(32), index=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    validateur_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    don: Mapped["Don"] = relationship(back_populates="analyses")


class ProductRule(Base):
    __tablename__ = "product_rules"

    type_produit: Mapped[str] = mapped_column(String(16), primary_key=True)
    shelf_life_days: Mapped[int] = mapped_column(Integer)
    default_volume_ml: Mapped[int | None] = mapped_column(Integer, nullable=True)
    min_volume_ml: Mapped[int | None] = mapped_column(Integer, nullable=True)
    max_volume_ml: Mapped[int | None] = mapped_column(Integer, nullable=True)
    isbt_product_code: Mapped[str | None] = mapped_column(String(16), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class FractionnementRecette(Base):
    __tablename__ = "fractionnement_recettes"

    code: Mapped[str] = mapped_column(String(32), primary_key=True)
    libelle: Mapped[str] = mapped_column(String(120))
    actif: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    site_code: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    type_source: Mapped[str] = mapped_column(String(16), default="ST")
    composants: Mapped[list[dict]] = mapped_column(JSON().with_variant(JSONB(), "postgresql"))
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Hopital(Base):
    __tablename__ = "hopitaux"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    adresse: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact: Mapped[str | None] = mapped_column(Text, nullable=True)
    convention_actif: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Commande(Base):
    __tablename__ = "commandes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hopital_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("hopitaux.id"), index=True)
    statut: Mapped[str] = mapped_column(String(16), index=True, default="BROUILLON")
    date_demande: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    date_livraison_prevue: Mapped[Date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    lignes: Mapped[list["LigneCommande"]] = relationship(back_populates="commande")


class LigneCommande(Base):
    __tablename__ = "ligne_commandes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    commande_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("commandes.id"), index=True)
    type_produit: Mapped[str] = mapped_column(String(16), index=True)
    groupe_sanguin: Mapped[str | None] = mapped_column(String(8), index=True, nullable=True)
    quantite: Mapped[int] = mapped_column(Integer)

    commande: Mapped["Commande"] = relationship(back_populates="lignes")


class Reservation(Base):
    __tablename__ = "reservations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poche_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("poches.id"), unique=True, index=True)
    commande_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("commandes.id"), index=True)
    ligne_commande_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("ligne_commandes.id"),
        nullable=True,
        index=True,
    )
    receveur_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("receveurs.id"),
        nullable=True,
        index=True,
    )
    date_reservation: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    expires_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    released_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class Receveur(Base):
    __tablename__ = "receveurs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom: Mapped[str | None] = mapped_column(String(200), nullable=True)
    prenom: Mapped[str | None] = mapped_column(String(200), nullable=True)
    sexe: Mapped[str | None] = mapped_column(String(1), nullable=True)
    date_naissance: Mapped[Date | None] = mapped_column(Date, nullable=True)
    adresse: Mapped[str | None] = mapped_column(Text, nullable=True)
    telephone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    hopital_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("hopitaux.id"), index=True, nullable=True)
    groupe_sanguin: Mapped[str | None] = mapped_column(String(8), index=True, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    hopital: Mapped["Hopital"] = relationship()


class CrossMatch(Base):
    __tablename__ = "cross_matches"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poche_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("poches.id"), index=True)
    receveur_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("receveurs.id"), index=True)
    resultat: Mapped[str] = mapped_column(String(16), index=True)
    validateur_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class ActeTransfusionnel(Base):
    __tablename__ = "actes_transfusionnels"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poche_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("poches.id"), unique=True, index=True)
    commande_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("commandes.id"), nullable=True, index=True)
    hopital_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("hopitaux.id"), nullable=True, index=True)
    receveur_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("receveurs.id"), nullable=True, index=True)
    date_transfusion: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
    )
    validateur_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class RappelLot(Base):
    __tablename__ = "rappels"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type_cible: Mapped[str] = mapped_column(String(16), index=True)
    valeur_cible: Mapped[str] = mapped_column(String(64), index=True)
    motif: Mapped[str | None] = mapped_column(Text, nullable=True)
    statut: Mapped[str] = mapped_column(String(16), index=True, default="OUVERT")
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )
    notified_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    confirmed_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class RappelAction(Base):
    __tablename__ = "rappel_actions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rappel_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("rappels.id"), index=True)
    action: Mapped[str] = mapped_column(String(16), index=True)
    validateur_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SyncDevice(Base):
    __tablename__ = "sync_devices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    label: Mapped[str | None] = mapped_column(String(200), nullable=True)
    last_seen_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SyncIngestedEvent(Base):
    __tablename__ = "sync_ingested_events"
    __table_args__ = (UniqueConstraint("sync_device_id", "client_event_id", name="uq_sync_device_event"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sync_device_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sync_devices.id"), index=True)
    client_event_id: Mapped[str] = mapped_column(String(128), index=True)
    event_type: Mapped[str] = mapped_column(String(64), index=True)
    payload: Mapped[dict] = mapped_column(JSON().with_variant(JSONB(), "postgresql"))
    status: Mapped[str] = mapped_column(String(16), index=True)
    error_code: Mapped[str | None] = mapped_column(String(64), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    response_json: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB(), "postgresql"), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)


class UserAccount(Base):
    __tablename__ = "user_accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    role: Mapped[str] = mapped_column(String(32), default="PATIENT", index=True)  # PATIENT, MEDECIN, ADMIN

    mfa_enabled: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    mfa_secret: Mapped[str | None] = mapped_column(Text, nullable=True)
    mfa_enabled_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    mfa_disabled_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    recovery_codes: Mapped[list["UserRecoveryCode"]] = relationship(back_populates="user")
    donneur: Mapped["Donneur"] = relationship(back_populates="user", uselist=False)


class UserRecoveryCode(Base):
    __tablename__ = "user_recovery_codes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user_accounts.id"), index=True)
    code_hash: Mapped[str] = mapped_column(Text, index=True)
    used_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["UserAccount"] = relationship(back_populates="recovery_codes")


class RendezVous(Base):
    __tablename__ = "rendez_vous"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donneur_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("donneurs.id"), index=True)
    date_prevue: Mapped[DateTime] = mapped_column(DateTime(timezone=True), index=True)
    type_rdv: Mapped[str] = mapped_column(String(32), default="DON_SANG")  # DON_SANG, CONSULTATION
    statut: Mapped[str] = mapped_column(String(16), default="CONFIRME")  # CONFIRME, ANNULE, EFFECTUE, MANQUE
    lieu: Mapped[str | None] = mapped_column(String(120), nullable=True)
    commentaire: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    donneur: Mapped["Donneur"] = relationship(back_populates="rendez_vous")


class DocumentMedical(Base):
    __tablename__ = "documents_medicaux"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donneur_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("donneurs.id"), index=True)
    titre: Mapped[str] = mapped_column(String(200))
    type_document: Mapped[str] = mapped_column(String(32))  # ANALYSE, COMPTE_RENDU, ATTESTATION
    fichier_url: Mapped[str] = mapped_column(String(500))
    date_document: Mapped[Date] = mapped_column(Date)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    donneur: Mapped["Donneur"] = relationship(back_populates="documents")


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    slug: Mapped[str] = mapped_column(String(200), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    content: Mapped[str] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(64), index=True)
    image_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    published_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    is_published: Mapped[bool] = mapped_column(Boolean, default=True, index=True)  # Deprecated in favor of status
    
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    @property
    def status(self) -> str:
        return "PUBLISHED" if self.is_published else "DRAFT"

    @property
    def tags(self) -> list[str]:
        return []

    @property
    def author_id(self) -> uuid.UUID | None:
        return None


class ColdChainStorage(Base):
    __tablename__ = "cold_chain_storages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    min_temp: Mapped[float] = mapped_column(Float)
    max_temp: Mapped[float] = mapped_column(Float)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    readings: Mapped[list["ColdChainReading"]] = relationship(back_populates="storage")


class ColdChainReading(Base):
    __tablename__ = "cold_chain_readings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    storage_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cold_chain_storages.id"), index=True)
    temperature_c: Mapped[float] = mapped_column(Float)
    recorded_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), index=True)
    source: Mapped[str | None] = mapped_column(String(32), nullable=True)
    note: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    storage: Mapped["ColdChainStorage"] = relationship(back_populates="readings")


# ──────────────────────────────────────────────
# Phase 1.1 : Background Tasks
# ──────────────────────────────────────────────

class TaskResult(Base):
    __tablename__ = "task_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    task_name: Mapped[str] = mapped_column(String(128), index=True)
    status: Mapped[str] = mapped_column(String(16), index=True, default="PENDING")
    result_json: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB(), "postgresql"), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    completed_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)


# ──────────────────────────────────────────────
# Phase 1.2 : Notifications
# ──────────────────────────────────────────────

class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    canal: Mapped[str] = mapped_column(String(16), index=True)
    destinataire: Mapped[str] = mapped_column(String(320), index=True)
    template: Mapped[str] = mapped_column(String(64), index=True)
    variables: Mapped[dict] = mapped_column(JSON().with_variant(JSONB(), "postgresql"))
    statut: Mapped[str] = mapped_column(String(16), index=True, default="EN_ATTENTE")
    priorite: Mapped[str] = mapped_column(String(16), default="NORMALE")
    tentatives: Mapped[int] = mapped_column(Integer, default=0)
    erreur: Mapped[str | None] = mapped_column(Text, nullable=True)
    sent_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user_accounts.id"), unique=True, index=True)
    email_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    sms_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    whatsapp_enabled: Mapped[bool] = mapped_column(Boolean, default=False)


# ──────────────────────────────────────────────
# Phase 1.3 : Multi-Sites
# ──────────────────────────────────────────────

class Site(Base):
    __tablename__ = "sites"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(16), unique=True, index=True)
    nom: Mapped[str] = mapped_column(String(200))
    type_site: Mapped[str] = mapped_column(String(32), index=True)
    adresse: Mapped[str | None] = mapped_column(Text, nullable=True)
    region: Mapped[str | None] = mapped_column(String(64), nullable=True)
    telephone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    email: Mapped[str | None] = mapped_column(String(120), nullable=True)
    responsable_nom: Mapped[str | None] = mapped_column(String(200), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class TransfertInterSite(Base):
    __tablename__ = "transferts_inter_sites"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    site_source_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sites.id"), index=True)
    site_destination_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("sites.id"), index=True)
    statut: Mapped[str] = mapped_column(String(32), index=True, default="BROUILLON")
    motif: Mapped[str | None] = mapped_column(Text, nullable=True)
    date_expedition: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    date_reception: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    transporteur: Mapped[str | None] = mapped_column(String(200), nullable=True)
    temperature_depart: Mapped[float | None] = mapped_column(Float, nullable=True)
    temperature_arrivee: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    lignes: Mapped[list["LigneTransfert"]] = relationship(back_populates="transfert")


class LigneTransfert(Base):
    __tablename__ = "ligne_transferts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transfert_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("transferts_inter_sites.id"), index=True)
    poche_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("poches.id"), index=True)
    statut_reception: Mapped[str | None] = mapped_column(String(16), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    transfert: Mapped["TransfertInterSite"] = relationship(back_populates="lignes")


# ──────────────────────────────────────────────
# Phase 2.1 : Phenotypage etendu + Groupes Rares
# ──────────────────────────────────────────────

class Phenotypage(Base):
    __tablename__ = "phenotypages"
    __table_args__ = (UniqueConstraint("donneur_id", "systeme", name="uq_phenotypage_donneur_systeme"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donneur_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("donneurs.id"), index=True)
    don_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("dons.id"), nullable=True, index=True)
    systeme: Mapped[str] = mapped_column(String(16), index=True)  # KELL, DUFFY, KIDD, MNS, LEWIS, P, LUTHERAN
    antigenes: Mapped[dict] = mapped_column(JSON().with_variant(JSONB(), "postgresql"))
    phenotype_complet: Mapped[str | None] = mapped_column(String(120), nullable=True)
    methode: Mapped[str | None] = mapped_column(String(64), nullable=True)
    validateur_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    is_confirmed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class RegistreGroupeRare(Base):
    __tablename__ = "registre_groupes_rares"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donneur_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("donneurs.id"), unique=True, index=True)
    phenotype_resume: Mapped[str] = mapped_column(String(255))
    rarete: Mapped[str] = mapped_column(String(16), index=True)  # RARE, TRES_RARE, EXCEPTIONNEL
    note_clinique: Mapped[str | None] = mapped_column(Text, nullable=True)
    dernier_contact: Mapped[Date | None] = mapped_column(Date, nullable=True)
    disponible: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


# ──────────────────────────────────────────────
# Phase 2.2 : RAI
# ──────────────────────────────────────────────

class RAI(Base):
    __tablename__ = "rai_tests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    receveur_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("receveurs.id"), index=True)
    commande_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("commandes.id"), nullable=True, index=True)
    date_prelevement: Mapped[DateTime] = mapped_column(DateTime(timezone=True))
    resultat: Mapped[str] = mapped_column(String(16), index=True, default="EN_ATTENTE")  # POSITIF, NEGATIF, EN_ATTENTE
    anticorps_identifies: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB(), "postgresql"), nullable=True)
    validite_heures: Mapped[int] = mapped_column(Integer, default=72)
    validateur_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ──────────────────────────────────────────────
# Phase 2.3 : Tests NAT (PCR)
# ──────────────────────────────────────────────

class TestNAT(Base):
    __tablename__ = "tests_nat"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    don_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dons.id"), index=True)
    type_test: Mapped[str] = mapped_column(String(16), index=True)  # VIH_NAT, VHB_NAT, VHC_NAT
    resultat_qualitatif: Mapped[str] = mapped_column(String(16), index=True, default="EN_ATTENTE")  # DETECTE, NON_DETECTE, INDETERMINE
    charge_virale: Mapped[float | None] = mapped_column(Float, nullable=True)
    unite: Mapped[str | None] = mapped_column(String(32), nullable=True)
    seuil_detection: Mapped[float | None] = mapped_column(Float, nullable=True)
    lot_reactif: Mapped[str | None] = mapped_column(String(64), nullable=True)
    automate_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    validateur_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ──────────────────────────────────────────────
# Phase 2.4 : Reactions Adverses Donneur
# ──────────────────────────────────────────────

class ReactionAdverseDonneur(Base):
    __tablename__ = "reactions_adverses_donneurs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    don_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dons.id"), index=True)
    donneur_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("donneurs.id"), index=True)
    type_reaction: Mapped[str] = mapped_column(String(32), index=True)  # VASOVAGALE, HEMATOME, MALAISE, LESION_NERVEUSE, ALLERGIE, AUTRE
    gravite: Mapped[str] = mapped_column(String(16), index=True)  # MINEURE, MODEREE, GRAVE
    moment: Mapped[str] = mapped_column(String(16))  # PENDANT, APRES_IMMEDIAT, RETARDE
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    prise_en_charge: Mapped[str | None] = mapped_column(Text, nullable=True)
    evolution: Mapped[str] = mapped_column(String(16), index=True, default="EN_COURS")  # RESOLUE, EN_COURS, SEQUELLE
    declarant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ──────────────────────────────────────────────
# Phase 2.5 : CULM (Controle Ultime Lit du Malade)
# ──────────────────────────────────────────────

class CULM(Base):
    __tablename__ = "culm"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    poche_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("poches.id"), index=True)
    receveur_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("receveurs.id"), index=True)
    commande_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("commandes.id"), nullable=True, index=True)
    identite_patient_verifiee: Mapped[bool] = mapped_column(Boolean)
    groupe_patient_controle: Mapped[str | None] = mapped_column(String(8), nullable=True)
    groupe_poche_controle: Mapped[str | None] = mapped_column(String(8), nullable=True)
    concordance_abo: Mapped[bool] = mapped_column(Boolean)
    beth_vincent: Mapped[str | None] = mapped_column(String(32), nullable=True)
    simonin: Mapped[str | None] = mapped_column(String(32), nullable=True)
    resultat: Mapped[str] = mapped_column(String(16), index=True)  # CONFORME, NON_CONFORME
    motif_non_conformite: Mapped[str | None] = mapped_column(Text, nullable=True)
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    tension_systolique: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tension_diastolique: Mapped[int | None] = mapped_column(Integer, nullable=True)
    frequence_cardiaque: Mapped[int | None] = mapped_column(Integer, nullable=True)
    operateur_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    lieu: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ──────────────────────────────────────────────
# Phase 2.6 : Suivi Per-Transfusionnel
# ──────────────────────────────────────────────

class SuiviPerTransfusionnel(Base):
    __tablename__ = "suivis_per_transfusionnels"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    acte_transfusionnel_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("actes_transfusionnels.id"), index=True)
    moment: Mapped[str] = mapped_column(String(16))  # T0, T15, T30, T60, FIN, POST_1H
    temperature: Mapped[float | None] = mapped_column(Float, nullable=True)
    tension_systolique: Mapped[int | None] = mapped_column(Integer, nullable=True)
    tension_diastolique: Mapped[int | None] = mapped_column(Integer, nullable=True)
    frequence_cardiaque: Mapped[int | None] = mapped_column(Integer, nullable=True)
    frequence_respiratoire: Mapped[int | None] = mapped_column(Integer, nullable=True)
    saturation_o2: Mapped[float | None] = mapped_column(Float, nullable=True)
    debit_ml_h: Mapped[int | None] = mapped_column(Integer, nullable=True)
    observation: Mapped[str | None] = mapped_column(Text, nullable=True)
    alerte: Mapped[bool] = mapped_column(Boolean, default=False)
    operateur_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ──────────────────────────────────────────────
# Phase 2.7 : EIR (Effets Indesirables Receveur)
# ──────────────────────────────────────────────

class EIR(Base):
    __tablename__ = "eir"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    acte_transfusionnel_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("actes_transfusionnels.id"), index=True)
    receveur_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("receveurs.id"), index=True)
    poche_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("poches.id"), index=True)
    type_eir: Mapped[str] = mapped_column(String(32), index=True)  # REACTION_FEBRILE, ALLERGIQUE, HEMOLYTIQUE_AIGUE, TACO, TRALI, INFECTION_BACTERIENNE, INCOMPATIBILITE_ABO, AUTRE
    gravite: Mapped[str] = mapped_column(String(16), index=True)  # GRADE_1, GRADE_2, GRADE_3, GRADE_4
    imputabilite: Mapped[str] = mapped_column(String(16), index=True)  # CERTAINE, PROBABLE, POSSIBLE, DOUTEUSE, EXCLUE
    delai_apparition_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    symptomes: Mapped[str | None] = mapped_column(Text, nullable=True)
    conduite_tenue: Mapped[str | None] = mapped_column(Text, nullable=True)
    evolution: Mapped[str] = mapped_column(String(32), index=True, default="EN_COURS")  # GUERISON_SANS_SEQUELLE, SEQUELLE, DECES, EN_COURS
    declarant_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    date_declaration: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    statut_investigation: Mapped[str] = mapped_column(String(16), index=True, default="OUVERTE")  # OUVERTE, EN_COURS, CLOTUREE
    conclusion: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ──────────────────────────────────────────────
# Phase 2.8 : Apherese
# ──────────────────────────────────────────────

class ProcedureApherese(Base):
    __tablename__ = "procedures_apherese"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    don_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("dons.id"), unique=True, index=True)
    donneur_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("donneurs.id"), index=True)
    type_apherese: Mapped[str] = mapped_column(String(32), index=True)  # PLAQUETTAPHERESE, PLASMAPHERESE, CYTAPHERESE
    automate: Mapped[str | None] = mapped_column(String(120), nullable=True)
    duree_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    volume_preleve_ml: Mapped[int | None] = mapped_column(Integer, nullable=True)
    volume_restitue_ml: Mapped[int | None] = mapped_column(Integer, nullable=True)
    anticoagulant: Mapped[str | None] = mapped_column(String(64), nullable=True)
    nb_cycles: Mapped[int | None] = mapped_column(Integer, nullable=True)
    operateur_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    statut: Mapped[str] = mapped_column(String(16), index=True, default="EN_COURS")  # EN_COURS, TERMINE, INTERROMPU
    motif_interruption: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ──────────────────────────────────────────────
# Phase 3.1 : Collectes Mobiles
# ──────────────────────────────────────────────

class CampagneCollecte(Base):
    __tablename__ = "campagnes_collecte"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    nom: Mapped[str] = mapped_column(String(200))
    site_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("sites.id"), nullable=True, index=True)
    type_campagne: Mapped[str] = mapped_column(String(32), index=True)  # FIXE, MOBILE, ENTREPRISE, UNIVERSITE
    lieu: Mapped[str | None] = mapped_column(String(200), nullable=True)
    adresse: Mapped[str | None] = mapped_column(Text, nullable=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    date_debut: Mapped[DateTime] = mapped_column(DateTime(timezone=True))
    date_fin: Mapped[DateTime] = mapped_column(DateTime(timezone=True))
    objectif_dons: Mapped[int | None] = mapped_column(Integer, nullable=True)
    statut: Mapped[str] = mapped_column(String(16), index=True, default="PLANIFIEE")  # PLANIFIEE, EN_COURS, TERMINEE, ANNULEE
    responsable_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    materiel_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    inscriptions: Mapped[list["InscriptionCollecte"]] = relationship(back_populates="campagne")


class InscriptionCollecte(Base):
    __tablename__ = "inscriptions_collecte"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    campagne_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("campagnes_collecte.id"), index=True)
    donneur_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("donneurs.id"), nullable=True, index=True)
    nom: Mapped[str | None] = mapped_column(String(200), nullable=True)
    telephone: Mapped[str | None] = mapped_column(String(32), nullable=True)
    creneau: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    statut: Mapped[str] = mapped_column(String(16), index=True, default="INSCRIT")  # INSCRIT, PRESENT, PRELEVE, ABSENT
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    campagne: Mapped["CampagneCollecte"] = relationship(back_populates="inscriptions")


# ──────────────────────────────────────────────
# Phase 3.2 : Prevision de Stock
# ──────────────────────────────────────────────

class PrevisionStock(Base):
    __tablename__ = "previsions_stock"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type_produit: Mapped[str] = mapped_column(String(16), index=True)
    groupe_sanguin: Mapped[str | None] = mapped_column(String(8), nullable=True, index=True)
    site_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("sites.id"), nullable=True, index=True)
    date_prevision: Mapped[Date] = mapped_column(Date, index=True)
    quantite_prevue: Mapped[int] = mapped_column(Integer)
    quantite_reelle: Mapped[int | None] = mapped_column(Integer, nullable=True)
    methode: Mapped[str] = mapped_column(String(32))  # MOYENNE_MOBILE, TENDANCE_LINEAIRE, SAISONNIER
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class SeuilAlerte(Base):
    __tablename__ = "seuils_alerte"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type_produit: Mapped[str] = mapped_column(String(16), index=True)
    groupe_sanguin: Mapped[str | None] = mapped_column(String(8), nullable=True, index=True)
    site_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("sites.id"), nullable=True, index=True)
    seuil_critique: Mapped[int] = mapped_column(Integer)
    seuil_alerte: Mapped[int] = mapped_column(Integer)
    seuil_confort: Mapped[int] = mapped_column(Integer)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ──────────────────────────────────────────────
# Phase 3.3 : Transport et Logistique
# ──────────────────────────────────────────────

class Livraison(Base):
    __tablename__ = "livraisons"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    commande_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("commandes.id"), nullable=True, index=True)
    transfert_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("transferts_inter_sites.id"), nullable=True, index=True)
    hopital_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("hopitaux.id"), nullable=True, index=True)
    statut: Mapped[str] = mapped_column(String(16), index=True, default="PREPAREE")  # PREPAREE, EN_TRANSIT, LIVREE, REFUSEE
    transporteur_nom: Mapped[str | None] = mapped_column(String(200), nullable=True)
    vehicule: Mapped[str | None] = mapped_column(String(64), nullable=True)
    temperature_depart: Mapped[float | None] = mapped_column(Float, nullable=True)
    temperature_arrivee: Mapped[float | None] = mapped_column(Float, nullable=True)
    heure_depart: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    heure_arrivee: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    signe_par: Mapped[str | None] = mapped_column(String(200), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    releves_temperature: Mapped[list["ReleveTemperatureTransport"]] = relationship(back_populates="livraison")


class ReleveTemperatureTransport(Base):
    __tablename__ = "releves_temperature_transport"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    livraison_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("livraisons.id"), index=True)
    temperature_c: Mapped[float] = mapped_column(Float)
    recorded_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), index=True)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    livraison: Mapped["Livraison"] = relationship(back_populates="releves_temperature")


# ──────────────────────────────────────────────
# Phase 4.1 : SMQ (Systeme Management Qualite)
# ──────────────────────────────────────────────

class DocumentQualite(Base):
    __tablename__ = "documents_qualite"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    titre: Mapped[str] = mapped_column(String(200))
    type_document: Mapped[str] = mapped_column(String(32), index=True)  # PROCEDURE, MODE_OPERATOIRE, FORMULAIRE, ENREGISTREMENT, POLITIQUE
    version: Mapped[str] = mapped_column(String(16), default="1.0")
    statut: Mapped[str] = mapped_column(String(16), index=True, default="BROUILLON")  # BROUILLON, EN_REVUE, APPROUVE, OBSOLETE
    fichier_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    redacteur_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    verificateur_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    approbateur_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    date_approbation: Mapped[Date | None] = mapped_column(Date, nullable=True)
    date_revision: Mapped[Date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )


class NonConformite(Base):
    __tablename__ = "non_conformites"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    titre: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    type_nc: Mapped[str] = mapped_column(String(16), index=True)  # PRODUIT, PROCESSUS, EQUIPEMENT, DOCUMENT, PERSONNEL, AUTRE
    gravite: Mapped[str] = mapped_column(String(16), index=True)  # MINEURE, MAJEURE, CRITIQUE
    statut: Mapped[str] = mapped_column(String(32), index=True, default="OUVERTE")  # OUVERTE, EN_INVESTIGATION, ACTION_CORRECTIVE, VERIFIEE, CLOTUREE
    detecteur_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    responsable_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    cause_racine: Mapped[str | None] = mapped_column(Text, nullable=True)
    action_immediate: Mapped[str | None] = mapped_column(Text, nullable=True)
    action_corrective: Mapped[str | None] = mapped_column(Text, nullable=True)
    date_cloture: Mapped[Date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CAPA(Base):
    __tablename__ = "capa"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    non_conformite_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("non_conformites.id"), nullable=True, index=True)
    type_action: Mapped[str] = mapped_column(String(16), index=True)  # CORRECTIVE, PREVENTIVE
    description: Mapped[str] = mapped_column(Text)
    responsable_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    date_echeance: Mapped[Date | None] = mapped_column(Date, nullable=True)
    statut: Mapped[str] = mapped_column(String(16), index=True, default="PLANIFIEE")  # PLANIFIEE, EN_COURS, REALISEE, VERIFIEE, EFFICACE, INEFFICACE
    verification: Mapped[str | None] = mapped_column(Text, nullable=True)
    efficacite: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class AuditInterne(Base):
    __tablename__ = "audits_internes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    titre: Mapped[str] = mapped_column(String(200))
    processus_audite: Mapped[str | None] = mapped_column(String(120), nullable=True)
    date_audit: Mapped[Date | None] = mapped_column(Date, nullable=True)
    auditeur_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    statut: Mapped[str] = mapped_column(String(16), index=True, default="PLANIFIE")  # PLANIFIE, EN_COURS, RAPPORT_REDIGE, CLOTURE
    constats: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB(), "postgresql"), nullable=True)
    conclusion: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ──────────────────────────────────────────────
# Phase 4.2 : Qualification Equipements
# ──────────────────────────────────────────────

class Equipement(Base):
    __tablename__ = "equipements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code_inventaire: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    nom: Mapped[str] = mapped_column(String(200))
    categorie: Mapped[str] = mapped_column(String(32), index=True)  # AUTOMATE_ANALYSE, CENTRIFUGEUSE, REFRIGERATEUR, CONGELATEUR, AGITATEUR, BALANCE, THERMOMETRE
    marque: Mapped[str | None] = mapped_column(String(120), nullable=True)
    modele: Mapped[str | None] = mapped_column(String(120), nullable=True)
    numero_serie: Mapped[str | None] = mapped_column(String(64), nullable=True)
    site_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("sites.id"), nullable=True, index=True)
    localisation: Mapped[str | None] = mapped_column(String(120), nullable=True)
    date_mise_service: Mapped[Date | None] = mapped_column(Date, nullable=True)
    date_prochaine_maintenance: Mapped[Date | None] = mapped_column(Date, nullable=True, index=True)
    date_prochaine_calibration: Mapped[Date | None] = mapped_column(Date, nullable=True, index=True)
    statut: Mapped[str] = mapped_column(String(16), index=True, default="EN_SERVICE")  # EN_SERVICE, EN_PANNE, EN_MAINTENANCE, HORS_SERVICE, REFORME
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    interventions: Mapped[list["InterventionEquipement"]] = relationship(back_populates="equipement")


class InterventionEquipement(Base):
    __tablename__ = "interventions_equipement"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    equipement_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("equipements.id"), index=True)
    type_intervention: Mapped[str] = mapped_column(String(32), index=True)  # MAINTENANCE_PREVENTIVE, MAINTENANCE_CORRECTIVE, CALIBRATION, QUALIFICATION
    date_intervention: Mapped[Date] = mapped_column(Date)
    technicien: Mapped[str | None] = mapped_column(String(200), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    resultat: Mapped[str] = mapped_column(String(16), index=True)  # CONFORME, NON_CONFORME
    prochaine_date: Mapped[Date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    equipement: Mapped["Equipement"] = relationship(back_populates="interventions")


# ──────────────────────────────────────────────
# Phase 4.3 : Formations et Habilitations
# ──────────────────────────────────────────────

class Formation(Base):
    __tablename__ = "formations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    titre: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    categorie: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    duree_heures: Mapped[int | None] = mapped_column(Integer, nullable=True)
    periodicite_mois: Mapped[int | None] = mapped_column(Integer, nullable=True)
    is_obligatoire: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Habilitation(Base):
    __tablename__ = "habilitations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user_accounts.id"), index=True)
    formation_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("formations.id"), index=True)
    date_obtention: Mapped[Date] = mapped_column(Date)
    date_expiration: Mapped[Date | None] = mapped_column(Date, nullable=True, index=True)
    statut: Mapped[str] = mapped_column(String(16), index=True, default="VALIDE")  # VALIDE, EXPIREE, RETIREE
    formateur: Mapped[str | None] = mapped_column(String(200), nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ──────────────────────────────────────────────
# Phase 5.1 : Interfacage Automates (ASTM/LIS2-A2)
# ──────────────────────────────────────────────

class InterfaceAutomate(Base):
    __tablename__ = "interfaces_automates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    nom: Mapped[str] = mapped_column(String(200))
    type_automate: Mapped[str | None] = mapped_column(String(64), nullable=True)
    protocole: Mapped[str] = mapped_column(String(16), index=True)  # ASTM, HL7, FICHIER
    host: Mapped[str | None] = mapped_column(String(200), nullable=True)
    port: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mapping_config: Mapped[dict | None] = mapped_column(JSON().with_variant(JSONB(), "postgresql"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    last_communication: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MessageAutomate(Base):
    __tablename__ = "messages_automates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interface_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("interfaces_automates.id"), index=True)
    direction: Mapped[str] = mapped_column(String(16), index=True)  # ENTRANT, SORTANT
    contenu_brut: Mapped[str | None] = mapped_column(Text, nullable=True)
    statut: Mapped[str] = mapped_column(String(16), index=True, default="RECU")  # RECU, TRAITE, ERREUR, IGNORE
    erreur: Mapped[str | None] = mapped_column(Text, nullable=True)
    analyse_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("analyses.id"), nullable=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ──────────────────────────────────────────────
# Phase 5.3 : DHIS2
# ──────────────────────────────────────────────

class DHIS2Export(Base):
    __tablename__ = "dhis2_exports"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    periode: Mapped[str] = mapped_column(String(16), index=True)
    org_unit: Mapped[str] = mapped_column(String(64))
    data_set: Mapped[str | None] = mapped_column(String(64), nullable=True)
    payload: Mapped[dict] = mapped_column(JSON().with_variant(JSONB(), "postgresql"))
    statut: Mapped[str] = mapped_column(String(16), index=True, default="EN_ATTENTE")  # EN_ATTENTE, ENVOYE, ECHEC
    response_code: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ──────────────────────────────────────────────
# Phase 6.1 : Facturation
# ──────────────────────────────────────────────

class Tarif(Base):
    __tablename__ = "tarifs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type_produit: Mapped[str] = mapped_column(String(16), index=True)
    prix_unitaire_fcfa: Mapped[int] = mapped_column(Integer)
    date_debut: Mapped[Date] = mapped_column(Date)
    date_fin: Mapped[Date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Facture(Base):
    __tablename__ = "factures"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    numero: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    commande_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("commandes.id"), nullable=True, index=True)
    hopital_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("hopitaux.id"), index=True)
    date_facture: Mapped[Date] = mapped_column(Date)
    montant_ht_fcfa: Mapped[int] = mapped_column(Integer)
    montant_ttc_fcfa: Mapped[int] = mapped_column(Integer)
    statut: Mapped[str] = mapped_column(String(32), index=True, default="EMISE")  # EMISE, ENVOYEE, PAYEE_PARTIELLEMENT, PAYEE, ANNULEE
    date_echeance: Mapped[Date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    lignes: Mapped[list["LigneFacture"]] = relationship(back_populates="facture")
    paiements: Mapped[list["Paiement"]] = relationship(back_populates="facture")


class LigneFacture(Base):
    __tablename__ = "lignes_facture"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    facture_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("factures.id"), index=True)
    type_produit: Mapped[str] = mapped_column(String(16))
    quantite: Mapped[int] = mapped_column(Integer)
    prix_unitaire_fcfa: Mapped[int] = mapped_column(Integer)
    montant_fcfa: Mapped[int] = mapped_column(Integer)

    facture: Mapped["Facture"] = relationship(back_populates="lignes")


class Paiement(Base):
    __tablename__ = "paiements"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    facture_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("factures.id"), index=True)
    montant_fcfa: Mapped[int] = mapped_column(Integer)
    mode_paiement: Mapped[str] = mapped_column(String(16))  # VIREMENT, CHEQUE, ESPECES, MOBILE_MONEY
    reference: Mapped[str | None] = mapped_column(String(64), nullable=True)
    date_paiement: Mapped[Date] = mapped_column(Date)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    facture: Mapped["Facture"] = relationship(back_populates="paiements")


# ──────────────────────────────────────────────
# Phase 6.2 : Gestion des Consommables
# ──────────────────────────────────────────────

class Consommable(Base):
    __tablename__ = "consommables"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    designation: Mapped[str] = mapped_column(String(200))
    categorie: Mapped[str] = mapped_column(String(32), index=True)  # REACTIF, POCHE_VIDE, KIT_PRELEVEMENT, EPI, TUBE, AUTRE
    unite: Mapped[str] = mapped_column(String(16))  # UNITE, FLACON, BOITE, LOT
    seuil_alerte: Mapped[int | None] = mapped_column(Integer, nullable=True)
    seuil_critique: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fournisseur: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class LotConsommable(Base):
    __tablename__ = "lots_consommable"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    consommable_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("consommables.id"), index=True)
    numero_lot: Mapped[str] = mapped_column(String(64), index=True)
    date_reception: Mapped[Date] = mapped_column(Date)
    date_peremption: Mapped[Date | None] = mapped_column(Date, nullable=True, index=True)
    quantite_recue: Mapped[int] = mapped_column(Integer)
    quantite_restante: Mapped[int] = mapped_column(Integer)
    fournisseur: Mapped[str | None] = mapped_column(String(200), nullable=True)
    certificat_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    site_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("sites.id"), nullable=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class MouvementConsommable(Base):
    __tablename__ = "mouvements_consommable"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lot_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("lots_consommable.id"), index=True)
    type_mouvement: Mapped[str] = mapped_column(String(16), index=True)  # ENTREE, SORTIE, AJUSTEMENT, PERTE
    quantite: Mapped[int] = mapped_column(Integer)
    motif: Mapped[str | None] = mapped_column(String(200), nullable=True)
    operateur_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ──────────────────────────────────────────────
# Phase 6.3 : Programme de Fidelisation Donneurs
# ──────────────────────────────────────────────

class CarteDonneur(Base):
    __tablename__ = "cartes_donneur"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donneur_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("donneurs.id"), unique=True, index=True)
    numero_carte: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    qr_code_data: Mapped[str | None] = mapped_column(String(500), nullable=True)
    niveau: Mapped[str] = mapped_column(String(16), index=True, default="BRONZE")  # BRONZE, ARGENT, OR, PLATINE
    points: Mapped[int] = mapped_column(Integer, default=0)
    total_dons: Mapped[int] = mapped_column(Integer, default=0)
    date_premier_don: Mapped[Date | None] = mapped_column(Date, nullable=True)
    date_dernier_don: Mapped[Date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    donneur: Mapped["Donneur"] = relationship(back_populates="carte_donneur")


class PointsHistorique(Base):
    __tablename__ = "points_historique"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    carte_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("cartes_donneur.id"), index=True)
    type_operation: Mapped[str] = mapped_column(String(32), index=True)  # DON, PARRAINAGE, BONUS_ANNIVERSAIRE, UTILISATION
    points: Mapped[int] = mapped_column(Integer)
    description: Mapped[str | None] = mapped_column(String(200), nullable=True)
    reference_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class CampagneRecrutement(Base):
    __tablename__ = "campagnes_recrutement"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nom: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    date_debut: Mapped[Date] = mapped_column(Date)
    date_fin: Mapped[Date | None] = mapped_column(Date, nullable=True)
    cible: Mapped[str | None] = mapped_column(String(200), nullable=True)
    canal: Mapped[str] = mapped_column(String(16))  # SMS, EMAIL, WHATSAPP, MIXTE
    message_template: Mapped[str | None] = mapped_column(Text, nullable=True)
    statut: Mapped[str] = mapped_column(String(16), index=True, default="PLANIFIEE")  # PLANIFIEE, EN_COURS, TERMINEE
    nb_contactes: Mapped[int] = mapped_column(Integer, default=0)
    nb_convertis: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
