"""add report indexes

Revision ID: 0003_report_indexes
Revises: 0002_item_source_cent
Create Date: 2024-08-30 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op

revision: str = "0003_report_indexes"
down_revision: Union[str, None] = "0002_item_source_cent"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_index("ix_item_jobs_current_status", "item_jobs", ["current_status"])
    op.create_index("ix_item_jobs_created_at", "item_jobs", ["created_at"])
    op.create_index(
        "ix_status_events_job_status_time",
        "status_events",
        ["job_id", "to_status", "timestamp"],
    )


def downgrade() -> None:
    op.drop_index("ix_status_events_job_status_time", table_name="status_events")
    op.drop_index("ix_item_jobs_created_at", table_name="item_jobs")
    op.drop_index("ix_item_jobs_current_status", table_name="item_jobs")
