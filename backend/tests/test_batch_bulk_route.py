from datetime import datetime, timezone
from types import SimpleNamespace

from app.models import BatchStatus, Status
from app.routers.batches import (
    _apply_batch_route_status,
    _bulk_route_source_statuses,
    _is_bulk_route_already_reached,
)


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
