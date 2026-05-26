from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.models import Role, Status, VoucherType
from app.utils.voucher_routes import batch_route, ensure_batch_matches_target, get_voucher_route


def test_factory_receipt_route_records_source_destination_and_type():
    route = get_voucher_route(Status.RECEIVED_AT_SHOP)

    assert route.voucher_type == VoucherType.RECEIPT
    assert route.source_role == Role.FACTORY
    assert route.destination_role == Role.QC_STOCK
    assert route.requires_factory is True


def test_qc_delivery_route_is_supported():
    route = get_voucher_route(Status.HANDED_TO_DELIVERY)

    assert route.voucher_type == VoucherType.ISSUE
    assert route.source_role == Role.QC_STOCK
    assert route.destination_role == Role.DELIVERY


def test_legacy_batch_route_defaults_to_dispatch():
    batch = SimpleNamespace(target_status=None)

    assert batch_route(batch).target_status == Status.DISPATCHED_TO_FACTORY


def test_batch_route_must_match_scan_target():
    batch = SimpleNamespace(target_status=Status.ADDED_TO_STOCK.value)

    with pytest.raises(HTTPException) as exc:
        ensure_batch_matches_target(batch, Status.HANDED_TO_DELIVERY)

    assert exc.value.status_code == 400
