"""add voucher number to item jobs

Revision ID: 0006_voucher_no
Revises: 0005_repair_fields
Create Date: 2025-02-01 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0006_voucher_no"
down_revision: Union[str, None] = "0005_repair_fields"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "item_jobs",
        sa.Column("voucher_no", sa.String(length=80), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("item_jobs", "voucher_no")
