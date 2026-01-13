"""init

Revision ID: 0001_init
Revises: 
Create Date: 2024-08-01 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0001_init"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    role_enum = sa.Enum(
        "Admin",
        "Purchase",
        "Packing",
        "Dispatch",
        "Factory",
        "QC_Stock",
        "Delivery",
        name="role",
    )
    status_enum = sa.Enum(
        "PURCHASED",
        "PACKED_READY",
        "DISPATCHED_TO_FACTORY",
        "RECEIVED_AT_FACTORY",
        "RETURNED_FROM_FACTORY",
        "RECEIVED_AT_SHOP",
        "ADDED_TO_STOCK",
        "HANDED_TO_DELIVERY",
        "DELIVERED_TO_CUSTOMER",
        "ON_HOLD",
        "CANCELLED",
        name="status",
    )
    batch_status_enum = sa.Enum(
        "CREATED",
        "DISPATCHED",
        "RECEIVED_AT_FACTORY",
        "RETURNED",
        "CLOSED",
        name="batch_status",
    )
    incident_type_enum = sa.Enum(
        "StickerMismatch",
        "MissingItem",
        "DuplicateScan",
        "Damage",
        "Other",
        name="incident_type",
    )
    incident_status_enum = sa.Enum("OPEN", "RESOLVED", name="incident_status")

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("username", sa.String(length=80), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role", role_enum, nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("username"),
    )
    op.create_index("ix_users_username", "users", ["username"], unique=True)

    op.create_table(
        "branches",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.create_table(
        "item_jobs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("job_id", sa.String(length=32), nullable=False),
        sa.Column("branch_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("customer_name", sa.String(length=120), nullable=True),
        sa.Column("customer_phone", sa.String(length=40), nullable=True),
        sa.Column("item_description", sa.Text(), nullable=False),
        sa.Column("approximate_weight", sa.Float(), nullable=True),
        sa.Column("purchase_value", sa.Float(), nullable=True),
        sa.Column("photos", postgresql.JSONB(astext_type=sa.Text()), server_default=sa.text("'[]'::jsonb")),
        sa.Column("current_status", status_enum, nullable=False),
        sa.Column("current_holder_role", role_enum, nullable=False),
        sa.Column("current_holder_user_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("last_scan_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["branch_id"], ["branches.id"]),
        sa.ForeignKeyConstraint(["current_holder_user_id"], ["users.id"]),
        sa.UniqueConstraint("job_id"),
    )
    op.create_index("ix_item_jobs_job_id", "item_jobs", ["job_id"], unique=True)

    op.create_table(
        "status_events",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("from_status", status_enum, nullable=True),
        sa.Column("to_status", status_enum, nullable=False),
        sa.Column("scanned_by_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("scanned_by_role", role_enum, nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("location", sa.String(length=120), nullable=True),
        sa.Column("device_id", sa.String(length=120), nullable=True),
        sa.Column("remarks", sa.Text(), nullable=True),
        sa.Column("incident_flag", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("override_reason", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["job_id"], ["item_jobs.id"]),
        sa.ForeignKeyConstraint(["scanned_by_user_id"], ["users.id"]),
    )

    op.create_table(
        "batches",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("batch_code", sa.String(length=32), nullable=False),
        sa.Column("branch_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("dispatch_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("expected_return_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", batch_status_enum, nullable=False, server_default="CREATED"),
        sa.Column("item_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("manifest_pdf_url", sa.String(length=255), nullable=True),
        sa.ForeignKeyConstraint(["branch_id"], ["branches.id"]),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.UniqueConstraint("batch_code"),
    )

    op.create_table(
        "batch_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("batch_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("added_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["batch_id"], ["batches.id"]),
        sa.ForeignKeyConstraint(["job_id"], ["item_jobs.id"]),
        sa.UniqueConstraint("batch_id", "job_id", name="uq_batch_item"),
    )

    op.create_table(
        "incidents",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("batch_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("type", incident_type_enum, nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("reported_by", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("resolution_notes", sa.Text(), nullable=True),
        sa.Column("attachments", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("status", incident_status_enum, nullable=False, server_default="OPEN"),
        sa.ForeignKeyConstraint(["job_id"], ["item_jobs.id"]),
        sa.ForeignKeyConstraint(["batch_id"], ["batches.id"]),
        sa.ForeignKeyConstraint(["reported_by"], ["users.id"]),
    )

    op.create_table(
        "refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("jti", sa.String(length=64), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.UniqueConstraint("jti"),
    )

    op.create_table(
        "job_edit_audits",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("job_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("edited_by_user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("edited_by_role", role_enum, nullable=False),
        sa.Column("edited_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("changes", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.ForeignKeyConstraint(["job_id"], ["item_jobs.id"]),
        sa.ForeignKeyConstraint(["edited_by_user_id"], ["users.id"]),
    )


def downgrade() -> None:
    op.drop_table("job_edit_audits")
    op.drop_table("refresh_tokens")
    op.drop_table("incidents")
    op.drop_table("batch_items")
    op.drop_table("batches")
    op.drop_table("status_events")
    op.drop_table("item_jobs")
    op.drop_table("branches")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS incident_status")
    op.execute("DROP TYPE IF EXISTS incident_type")
    op.execute("DROP TYPE IF EXISTS batch_status")
    op.execute("DROP TYPE IF EXISTS status")
    op.execute("DROP TYPE IF EXISTS role")
