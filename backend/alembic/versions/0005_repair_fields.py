"""repair fields for jobs

Revision ID: 0005_repair_fields
Revises: 0004_multi_role_factories
Create Date: 2025-01-15 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0005_repair_fields"
down_revision: Union[str, None] = "0004_multi_role_factories"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    repair_enum = sa.Enum(
        "Customer Repair",
        "Stock Repair",
        name="repair_type",
    )
    repair_enum.create(op.get_bind(), checkfirst=True)

    op.add_column(
        "item_jobs",
        sa.Column("repair_type", repair_enum, nullable=True),
    )
    op.add_column(
        "item_jobs",
        sa.Column("work_narration", sa.Text(), nullable=True),
    )
    op.add_column(
        "item_jobs",
        sa.Column("target_return_date", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "item_jobs",
        sa.Column("factory_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_item_jobs_factory_id",
        "item_jobs",
        "factories",
        ["factory_id"],
        ["id"],
    )
    op.create_index(
        "ix_item_jobs_target_return_date",
        "item_jobs",
        ["target_return_date"],
    )


def downgrade() -> None:
    op.drop_index("ix_item_jobs_target_return_date", table_name="item_jobs")
    op.drop_constraint("fk_item_jobs_factory_id", "item_jobs", type_="foreignkey")
    op.drop_column("item_jobs", "factory_id")
    op.drop_column("item_jobs", "target_return_date")
    op.drop_column("item_jobs", "work_narration")
    op.drop_column("item_jobs", "repair_type")

    repair_enum = sa.Enum(
        "Customer Repair",
        "Stock Repair",
        name="repair_type",
    )
    repair_enum.drop(op.get_bind(), checkfirst=True)
