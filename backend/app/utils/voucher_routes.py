from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable

from fastapi import HTTPException

from app.models import Batch, Role, Status, VoucherType


@dataclass(frozen=True)
class VoucherRoute:
    target_status: Status
    voucher_type: VoucherType
    source_role: Role
    destination_role: Role
    operator_roles: tuple[Role, ...]
    requires_factory: bool = False


VOUCHER_ROUTES: dict[Status, VoucherRoute] = {
    Status.DISPATCHED_TO_FACTORY: VoucherRoute(
        target_status=Status.DISPATCHED_TO_FACTORY,
        voucher_type=VoucherType.ISSUE,
        source_role=Role.DISPATCH,
        destination_role=Role.FACTORY,
        operator_roles=(Role.DISPATCH,),
        requires_factory=True,
    ),
    Status.RECEIVED_AT_FACTORY: VoucherRoute(
        target_status=Status.RECEIVED_AT_FACTORY,
        voucher_type=VoucherType.RECEIPT,
        source_role=Role.DISPATCH,
        destination_role=Role.FACTORY,
        operator_roles=(Role.FACTORY,),
        requires_factory=True,
    ),
    Status.RECEIVED_AT_SHOP: VoucherRoute(
        target_status=Status.RECEIVED_AT_SHOP,
        voucher_type=VoucherType.RECEIPT,
        source_role=Role.FACTORY,
        destination_role=Role.QC_STOCK,
        operator_roles=(Role.QC_STOCK,),
        requires_factory=True,
    ),
    Status.ADDED_TO_STOCK: VoucherRoute(
        target_status=Status.ADDED_TO_STOCK,
        voucher_type=VoucherType.MOVEMENT,
        source_role=Role.QC_STOCK,
        destination_role=Role.QC_STOCK,
        operator_roles=(Role.QC_STOCK,),
    ),
    Status.HANDED_TO_DELIVERY: VoucherRoute(
        target_status=Status.HANDED_TO_DELIVERY,
        voucher_type=VoucherType.ISSUE,
        source_role=Role.QC_STOCK,
        destination_role=Role.DELIVERY,
        operator_roles=(Role.QC_STOCK,),
    ),
}


def get_voucher_route(target_status: Status) -> VoucherRoute:
    route = VOUCHER_ROUTES.get(target_status)
    if not route:
        raise HTTPException(status_code=400, detail="Unsupported voucher route")
    return route


def batch_target_status(batch: Batch) -> Status:
    if batch.target_status:
        return Status(batch.target_status)
    return Status.DISPATCHED_TO_FACTORY


def batch_route(batch: Batch) -> VoucherRoute:
    return get_voucher_route(batch_target_status(batch))


def ensure_operator_can_create_route(user_roles: Iterable[Role], route: VoucherRoute) -> None:
    role_set = set(user_roles)
    if Role.ADMIN in role_set:
        return
    if not role_set.intersection(route.operator_roles):
        raise HTTPException(status_code=403, detail="Role cannot create this voucher route")


def ensure_batch_matches_target(batch: Batch, target_status: Status) -> VoucherRoute:
    route = batch_route(batch)
    if route.target_status != target_status:
        raise HTTPException(
            status_code=400,
            detail=f"Voucher route targets {route.target_status.value}, not {target_status.value}",
        )
    return route
