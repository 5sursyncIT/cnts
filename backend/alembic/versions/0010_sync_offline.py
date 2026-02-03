"""sync offline-first events

Revision ID: 0010_sync_offline
Revises: 0009_rappel_workflow
Create Date: 2026-02-03

"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0010_sync_offline"
down_revision = "0009_rappel_workflow"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "sync_devices",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column("device_id", sa.String(length=128), nullable=False),
        sa.Column("label", sa.String(length=200), nullable=True),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("device_id", name="uq_sync_devices_device_id"),
    )
    op.create_index("ix_sync_devices_device_id", "sync_devices", ["device_id"])
    op.create_index("ix_sync_devices_last_seen_at", "sync_devices", ["last_seen_at"])

    op.create_table(
        "sync_ingested_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, nullable=False),
        sa.Column(
            "sync_device_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("sync_devices.id"),
            nullable=False,
        ),
        sa.Column("client_event_id", sa.String(length=128), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("payload", postgresql.JSONB(), nullable=False),
        sa.Column("status", sa.String(length=16), nullable=False),
        sa.Column("error_code", sa.String(length=64), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("response_json", postgresql.JSONB(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()")),
        sa.UniqueConstraint("sync_device_id", "client_event_id", name="uq_sync_device_event"),
    )
    op.create_index("ix_sync_ingested_events_sync_device_id", "sync_ingested_events", ["sync_device_id"])
    op.create_index("ix_sync_ingested_events_client_event_id", "sync_ingested_events", ["client_event_id"])
    op.create_index("ix_sync_ingested_events_event_type", "sync_ingested_events", ["event_type"])
    op.create_index("ix_sync_ingested_events_status", "sync_ingested_events", ["status"])
    op.create_index("ix_sync_ingested_events_created_at", "sync_ingested_events", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_sync_ingested_events_created_at", table_name="sync_ingested_events")
    op.drop_index("ix_sync_ingested_events_status", table_name="sync_ingested_events")
    op.drop_index("ix_sync_ingested_events_event_type", table_name="sync_ingested_events")
    op.drop_index("ix_sync_ingested_events_client_event_id", table_name="sync_ingested_events")
    op.drop_index("ix_sync_ingested_events_sync_device_id", table_name="sync_ingested_events")
    op.drop_table("sync_ingested_events")

    op.drop_index("ix_sync_devices_last_seen_at", table_name="sync_devices")
    op.drop_index("ix_sync_devices_device_id", table_name="sync_devices")
    op.drop_table("sync_devices")
