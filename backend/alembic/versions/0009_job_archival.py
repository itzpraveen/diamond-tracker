"""add item job archival fields

Revision ID: 0009_job_archival
Revises: 0008_batch_archival
Create Date: 2026-03-08 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0009_job_archival"
down_revision: Union[str, None] = "0008_batch_archival"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "item_jobs",
        sa.Column("is_archived", sa.Boolean(), nullable=False, server_default=sa.text("false")),
    )
    op.add_column(
        "item_jobs",
        sa.Column("archived_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "item_jobs",
        sa.Column("archived_by", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column(
        "item_jobs",
        sa.Column("archive_reason", sa.Text(), nullable=True),
    )
    op.create_foreign_key(
        "fk_item_jobs_archived_by_users",
        "item_jobs",
        "users",
        ["archived_by"],
        ["id"],
    )
    op.alter_column("item_jobs", "is_archived", server_default=None)


def downgrade() -> None:
    op.drop_constraint("fk_item_jobs_archived_by_users", "item_jobs", type_="foreignkey")
    op.drop_column("item_jobs", "archive_reason")
    op.drop_column("item_jobs", "archived_by")
    op.drop_column("item_jobs", "archived_at")
    op.drop_column("item_jobs", "is_archived")
