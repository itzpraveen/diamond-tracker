from datetime import datetime, timezone
from types import SimpleNamespace

from app.models import ItemSource, RepairType
from app.utils.pdf import _build_label_fields, _wrap_text


def _make_job(*, diamond_cent: float | None, style_number: str, work_narration: str):
    return SimpleNamespace(
        job_id="JOB-101",
        item_source=ItemSource.REPAIR,
        repair_type=RepairType.CUSTOMER_REPAIR,
        factory_name="Polish House",
        work_narration=work_narration,
        style_number=style_number,
        approximate_weight=2.45,
        diamond_cent=diamond_cent,
        purchase_value=18500,
        voucher_no="VCH-2026-03-010",
        customer_name="Anita",
        item_description="Cluster ring with side stones",
        created_at=datetime(2026, 3, 1, 9, 30, tzinfo=timezone.utc),
        target_return_date=datetime(2026, 3, 18, 18, 0, tzinfo=timezone.utc),
    )


def test_build_label_fields_include_style_number_and_carat():
    job = _make_job(
        diamond_cent=0.3,
        style_number="STYLE-900",
        work_narration="Stone tightening and final polish",
    )

    left_fields, right_fields = _build_label_fields(job, factory_name=None)
    field_map = {field["label"]: field for field in [*left_fields, *right_fields]}

    assert field_map["Style Number"]["value"] == "STYLE-900"
    assert field_map["Diamond"]["value"] == "0.3 ct"
    assert field_map["Narration"]["multiline"] is True


def test_wrap_text_splits_long_narration_into_multiple_lines():
    lines = _wrap_text(
        "Stone replacement and polishing for the full cluster setting",
        max_width=80,
        font_name="Helvetica-Bold",
        font_size=6,
    )

    assert len(lines) > 1
    assert " ".join(lines) == "Stone replacement and polishing for the full cluster setting"
