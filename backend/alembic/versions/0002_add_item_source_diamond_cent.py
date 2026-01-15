"""add item source and diamond cent

Revision ID: 0002_add_item_source_diamond_cent
Revises: 0001_init
Create Date: 2024-08-30 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002_add_item_source_diamond_cent"
down_revision: Union[str, None] = "0001_init"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    item_source_enum = sa.Enum("Old", "Repair", name="item_source")
    item_source_enum.create(op.get_bind(), checkfirst=True)
    op.add_column("item_jobs", sa.Column("item_source", item_source_enum, nullable=True))
    op.add_column("item_jobs", sa.Column("diamond_cent", sa.Float(), nullable=True))


def downgrade() -> None:
    op.drop_column("item_jobs", "diamond_cent")
    op.drop_column("item_jobs", "item_source")
    item_source_enum = sa.Enum("Old", "Repair", name="item_source")
    item_source_enum.drop(op.get_bind(), checkfirst=True)
