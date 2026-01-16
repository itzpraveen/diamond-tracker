"""multi role users and factories

Revision ID: 0004_multi_role_factories
Revises: 0003_report_indexes
Create Date: 2024-10-01 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0004_multi_role_factories"
down_revision: Union[str, None] = "0003_report_indexes"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE item_source RENAME VALUE 'Old' TO 'Stock'")

    op.create_table(
        "factories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.add_column(
        "batches",
        sa.Column("factory_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_batches_factory_id",
        "batches",
        "factories",
        ["factory_id"],
        ["id"],
    )

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
    op.add_column(
        "users",
        sa.Column(
            "roles",
            postgresql.ARRAY(role_enum),
            nullable=False,
            server_default=sa.text("'{}'::role[]"),
        ),
    )
    op.execute("UPDATE users SET roles = ARRAY[role]::role[]")
    op.drop_column("users", "role")


def downgrade() -> None:
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
    op.add_column("users", sa.Column("role", role_enum, nullable=True))
    op.execute("UPDATE users SET role = roles[1] WHERE roles IS NOT NULL AND array_length(roles, 1) >= 1")
    op.alter_column("users", "role", nullable=False)
    op.drop_column("users", "roles")

    op.drop_constraint("fk_batches_factory_id", "batches", type_="foreignkey")
    op.drop_column("batches", "factory_id")
    op.drop_table("factories")

    op.execute("ALTER TYPE item_source RENAME VALUE 'Stock' TO 'Old'")
