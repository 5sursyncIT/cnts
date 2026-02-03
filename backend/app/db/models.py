import uuid

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, JSON, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Donneur(Base):
    __tablename__ = "donneurs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cni_hash: Mapped[str] = mapped_column(String(128), unique=True, index=True)
    cni: Mapped[str | None] = mapped_column(String(64), nullable=True)  # Stockage en clair pour affichage
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

    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[DateTime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
    )

    dons: Mapped[list["Don"]] = relationship(back_populates="donneur")


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
    groupe_sanguin: Mapped[str | None] = mapped_column(String(8), index=True, nullable=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())


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


class UserRecoveryCode(Base):
    __tablename__ = "user_recovery_codes"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("user_accounts.id"), index=True)
    code_hash: Mapped[str] = mapped_column(Text, index=True)
    used_at: Mapped[DateTime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    created_at: Mapped[DateTime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    user: Mapped["UserAccount"] = relationship(back_populates="recovery_codes")
