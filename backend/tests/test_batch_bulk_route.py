from datetime import datetime, timezone
from types import SimpleNamespace
import uuid

import pytest
from fastapi import HTTPException

from app.models import BatchStatus, Role, Status, VoucherType
from app.routers import batches as batches_router
from app.routers.batches import (
    _apply_batch_route_status,
    _bulk_route_source_statuses,
    _is_bulk_route_already_reached,
)
from app.schemas import BatchRouteRequest


class FakeDb:
    def __init__(self):
        self.added = []
        self.committed = False

    def add(self, value):
        self.added.append(value)

    def commit(self):
        self.committed = True

    def refresh(self, value):
        return None


def _batch_for_route(target_status: Status, *, job_status: Status) -> tuple[SimpleNamespace, SimpleNamespace]:
    user_id = uuid.uuid4()
    job = SimpleNamespace(
        id=uuid.uuid4(),
        job_id="DJ-2026-000036",
        current_status=job_status,
        current_holder_role=None,
        current_holder_user_id=None,
        last_scan_at=None,
        factory_id=None,
        is_archived=False,
    )
    batch = SimpleNamespace(
        id=uuid.uuid4(),
        batch_code="VCH-2026-03-012",
        branch_id=uuid.uuid4(),
        created_by=user_id,
        factory_id=None,
        factory_name=None,
        created_at=datetime(2026, 3, 1, tzinfo=timezone.utc),
        dispatch_date=None,
        expected_return_date=None,
        status=BatchStatus.CREATED,
        item_count=1,
        manifest_pdf_url=None,
        voucher_type=VoucherType.MOVEMENT.value,
        source_role=Role.QC_STOCK.value,
        destination_role=Role.QC_STOCK.value,
        target_status=target_status.value,
        is_archived=False,
        archived_at=None,
        archived_by=None,
        archive_reason=None,
        items=[SimpleNamespace(job=job, added_at=None)],
    )
    return batch, job


def test_factory_to_shop_bulk_route_accepts_dispatched_factory_sources():
    assert _bulk_route_source_statuses(Status.RECEIVED_AT_SHOP) == {
        Status.DISPATCHED_TO_FACTORY,
        Status.RECEIVED_AT_FACTORY,
        Status.RETURNED_FROM_FACTORY,
    }


def test_bulk_route_treats_downstream_status_as_already_processed():
    assert _is_bulk_route_already_reached(Status.ADDED_TO_STOCK, Status.RECEIVED_AT_SHOP)
    assert _is_bulk_route_already_reached(Status.DELIVERED_TO_CUSTOMER, Status.HANDED_TO_DELIVERY)
    assert not _is_bulk_route_already_reached(Status.RECEIVED_AT_SHOP, Status.HANDED_TO_DELIVERY)


def test_apply_batch_route_status_records_receipt_state_without_overwriting_date():
    existing_date = datetime(2026, 5, 1, tzinfo=timezone.utc)
    processed_at = datetime(2026, 5, 2, tzinfo=timezone.utc)
    batch = SimpleNamespace(status=BatchStatus.DISPATCHED, dispatch_date=existing_date)

    _apply_batch_route_status(batch, Status.RECEIVED_AT_SHOP, processed_at)

    assert batch.status == BatchStatus.RETURNED
    assert batch.dispatch_date == existing_date


def test_apply_batch_route_status_uses_processed_date_for_new_voucher():
    processed_at = datetime(2026, 5, 2, tzinfo=timezone.utc)
    batch = SimpleNamespace(status=BatchStatus.CREATED, dispatch_date=None)

    _apply_batch_route_status(batch, Status.ADDED_TO_STOCK, processed_at)

    assert batch.status == BatchStatus.CLOSED
    assert batch.dispatch_date == processed_at


def test_route_batch_uses_saved_voucher_route_when_target_status_omitted(monkeypatch):
    batch, job = _batch_for_route(Status.ADDED_TO_STOCK, job_status=Status.RECEIVED_AT_SHOP)
    db = FakeDb()
    user = SimpleNamespace(id=uuid.uuid4(), roles=[Role.ADMIN])

    monkeypatch.setattr(batches_router, "_get_batch", lambda *args, **kwargs: batch)

    result = batches_router.route_batch("VCH-2026-03-012", BatchRouteRequest(), user=user, db=db)

    assert result.batch.id == batch.id
    assert result.updated_job_ids == ["DJ-2026-000036"]
    assert result.skipped_job_ids == []
    assert job.current_status == Status.ADDED_TO_STOCK
    assert db.committed is True


def test_route_batch_rejects_target_status_that_does_not_match_voucher(monkeypatch):
    batch, _job = _batch_for_route(Status.RECEIVED_AT_SHOP, job_status=Status.RECEIVED_AT_FACTORY)
    db = FakeDb()
    user = SimpleNamespace(id=uuid.uuid4(), roles=[Role.ADMIN])

    monkeypatch.setattr(batches_router, "_get_batch", lambda *args, **kwargs: batch)

    with pytest.raises(HTTPException) as exc:
        batches_router.route_batch(
            "VCH-2026-03-012",
            BatchRouteRequest(target_status=Status.ADDED_TO_STOCK),
            user=user,
            db=db,
        )

    assert exc.value.status_code == 400
    assert exc.value.detail == "Voucher route targets RECEIVED_AT_SHOP, not ADDED_TO_STOCK"
    assert db.committed is False
