from datetime import datetime, timezone
from types import SimpleNamespace

import pytest

from app.models import BatchStatus, ItemSource, RepairType, Status
from app.routers.batches import _build_manifest_workbook


def _make_job(
    *,
    job_id: str,
    approximate_weight: float | None,
    diamond_cent: float | None,
    purchase_value: float | None,
):
    return SimpleNamespace(
        job_id=job_id,
        voucher_no="VCH-2026-03-001",
        customer_name=f"Customer {job_id}",
        customer_phone="9999999999",
        item_description=f"Item {job_id}",
        style_number=f"STYLE-{job_id}",
        card_weight=1.25,
        approximate_weight=approximate_weight,
        diamond_cent=diamond_cent,
        purchase_value=purchase_value,
        factory_name="Polish House",
        current_status=Status.DISPATCHED_TO_FACTORY,
        work_narration="Stone check",
        item_source=ItemSource.REPAIR,
        repair_type=RepairType.CUSTOMER_REPAIR,
        target_return_date=datetime(2026, 3, 15, tzinfo=timezone.utc),
        created_at=datetime(2026, 3, 1, 9, 30, tzinfo=timezone.utc),
    )


def test_build_manifest_workbook_includes_line_items_and_totals():
    batch = SimpleNamespace(
        batch_code="VCH-2026-03-001",
        status=BatchStatus.DISPATCHED,
        factory_name="Polish House",
        created_at=datetime(2026, 3, 1, 9, 0, tzinfo=timezone.utc),
        dispatch_date=datetime(2026, 3, 1, 10, 0, tzinfo=timezone.utc),
        expected_return_date=datetime(2026, 3, 15, 18, 0, tzinfo=timezone.utc),
        item_count=2,
        items=[
            SimpleNamespace(
                job=_make_job(
                    job_id="JOB-002",
                    approximate_weight=2.25,
                    diamond_cent=30,
                    purchase_value=15000,
                ),
                added_at=datetime(2026, 3, 1, 11, 0, tzinfo=timezone.utc),
            ),
            SimpleNamespace(
                job=_make_job(
                    job_id="JOB-001",
                    approximate_weight=1.75,
                    diamond_cent=20,
                    purchase_value=10000,
                ),
                added_at=datetime(2026, 3, 1, 10, 0, tzinfo=timezone.utc),
            ),
        ],
    )

    workbook = _build_manifest_workbook(batch)

    assert workbook.active.title == "Items"
    assert workbook.sheetnames == ["Voucher", "Items"]

    summary = workbook["Voucher"]
    summary_values = {
        summary.cell(row=row_idx, column=1).value: summary.cell(row=row_idx, column=2).value
        for row_idx in range(2, summary.max_row + 1)
    }
    assert summary_values["Item Count"] == 2
    assert summary_values["Total Weight (g)"] == pytest.approx(4.0)
    assert summary_values["Total Carat (ct)"] == pytest.approx(0.5)
    assert summary_values["Total Value/Amount"] == pytest.approx(25000.0)

    items = workbook["Items"]
    headers = [items.cell(row=1, column=column_idx).value for column_idx in range(1, 19)]
    assert headers[:5] == ["Job ID", "Item Details", "Total Weight", "Total Carat", "Total Value"]
    assert items["A2"].value == "JOB-001"
    assert items["A3"].value == "JOB-002"
    assert items["B2"].value == "Item JOB-001"
    assert items["C2"].value == pytest.approx(1.75)
    assert items["D2"].value == pytest.approx(0.2)
    assert items["E2"].value == pytest.approx(10000.0)

    totals = {
        items.cell(row=row_idx, column=1).value: items.cell(row=row_idx, column=2).value
        for row_idx in range(1, items.max_row + 1)
    }
    assert totals["Total Weight (g)"] == pytest.approx(4.0)
    assert totals["Total Carat (ct)"] == pytest.approx(0.5)
    assert totals["Total Value/Amount"] == pytest.approx(25000.0)


def test_build_manifest_workbook_preserves_decimal_carat_values():
    batch = SimpleNamespace(
        batch_code="VCH-2026-03-002",
        status=BatchStatus.DISPATCHED,
        factory_name="Polish House",
        created_at=datetime(2026, 3, 2, 9, 0, tzinfo=timezone.utc),
        dispatch_date=datetime(2026, 3, 2, 10, 0, tzinfo=timezone.utc),
        expected_return_date=datetime(2026, 3, 16, 18, 0, tzinfo=timezone.utc),
        item_count=1,
        items=[
            SimpleNamespace(
                job=_make_job(
                    job_id="JOB-003",
                    approximate_weight=1.2,
                    diamond_cent=0.37,
                    purchase_value=8000,
                ),
                added_at=datetime(2026, 3, 2, 10, 30, tzinfo=timezone.utc),
            ),
        ],
    )

    workbook = _build_manifest_workbook(batch)

    summary = workbook["Voucher"]
    summary_values = {
        summary.cell(row=row_idx, column=1).value: summary.cell(row=row_idx, column=2).value
        for row_idx in range(2, summary.max_row + 1)
    }
    assert summary_values["Total Carat (ct)"] == pytest.approx(0.37)

    items = workbook["Items"]
    assert items["D2"].value == pytest.approx(0.37)
    assert items["D2"].number_format == "#,##0.###"
