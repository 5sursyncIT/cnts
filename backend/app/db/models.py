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
