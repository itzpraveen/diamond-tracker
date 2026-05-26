"""add voucher routing fields

Revision ID: 0010_voucher_routing
Revises: 0009_job_archival
Create Date: 2026-05-26 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0010_voucher_routing"
down_revision: Union[str, None] = "0009_job_archival"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "batches",
        sa.Column("voucher_type", sa.String(length=16), nullable=False, server_default="ISSUE"),
    )
    op.add_column("batches", sa.Column("source_role", sa.String(length=32), nullable=True))
    op.add_column("batches", sa.Column("destination_role", sa.String(length=32), nullable=True))
    op.add_column("batches", sa.Column("target_status", sa.String(length=32), nullable=True))
    op.execute(
        """
        UPDATE batches
        SET source_role = 'Dispatch',
            destination_role = 'Factory',
            target_status = 'DISPATCHED_TO_FACTORY'
        WHERE target_status IS NULL
        """
    )
    op.alter_column("batches", "voucher_type", server_default=None)


def downgrade() -> None:
    op.drop_column("batches", "target_status")
    op.drop_column("batches", "destination_role")
    op.drop_column("batches", "source_role")
    op.drop_column("batches", "voucher_type")
