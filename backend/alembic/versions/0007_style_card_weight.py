"""add style_number and card_weight to item_jobs

Revision ID: 0007_style_card_weight
Revises: 0006_voucher_no
Create Date: 2025-03-01 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0007_style_card_weight"
down_revision: Union[str, None] = "0006_voucher_no"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "item_jobs",
        sa.Column("style_number", sa.String(length=80), nullable=True),
    )
    op.add_column(
        "item_jobs",
        sa.Column("card_weight", sa.Float(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("item_jobs", "card_weight")
    op.drop_column("item_jobs", "style_number")
