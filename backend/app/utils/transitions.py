from __future__ import annotations

from typing import Iterable

from app.models import Role, Status

ALLOWED_TRANSITIONS: dict[Status, set[Status]] = {
    Status.PURCHASED: {Status.PACKED_READY},
    Status.PACKED_READY: {Status.DISPATCHED_TO_FACTORY},
    Status.DISPATCHED_TO_FACTORY: {Status.RECEIVED_AT_FACTORY, Status.RECEIVED_AT_SHOP},
    Status.RECEIVED_AT_FACTORY: {Status.RETURNED_FROM_FACTORY},
    Status.RETURNED_FROM_FACTORY: {Status.RECEIVED_AT_SHOP},
    Status.RECEIVED_AT_SHOP: {Status.ADDED_TO_STOCK, Status.HANDED_TO_DELIVERY},
    Status.HANDED_TO_DELIVERY: {Status.DELIVERED_TO_CUSTOMER},
}

TERMINAL_STATUSES = {Status.DELIVERED_TO_CUSTOMER, Status.CANCELLED}

ROLE_ALLOWED_TO_STATUS: dict[Role, set[Status]] = {
    Role.ADMIN: set(Status),
    Role.PURCHASE: {Status.PURCHASED},
    Role.PACKING: {Status.PACKED_READY},
    Role.DISPATCH: {Status.DISPATCHED_TO_FACTORY},
    Role.FACTORY: {Status.RECEIVED_AT_FACTORY, Status.RETURNED_FROM_FACTORY},
    Role.QC_STOCK: {Status.RECEIVED_AT_SHOP, Status.ADDED_TO_STOCK, Status.HANDED_TO_DELIVERY},
    Role.DELIVERY: {Status.DELIVERED_TO_CUSTOMER},
}

STATUS_HOLDER_ROLE: dict[Status, Role] = {
    Status.PURCHASED: Role.PURCHASE,
    Status.PACKED_READY: Role.DISPATCH,
    Status.DISPATCHED_TO_FACTORY: Role.FACTORY,
    Status.RECEIVED_AT_FACTORY: Role.FACTORY,
    Status.RETURNED_FROM_FACTORY: Role.QC_STOCK,
    Status.RECEIVED_AT_SHOP: Role.QC_STOCK,
    Status.ADDED_TO_STOCK: Role.QC_STOCK,
    Status.HANDED_TO_DELIVERY: Role.DELIVERY,
    Status.DELIVERED_TO_CUSTOMER: Role.DELIVERY,
    Status.ON_HOLD: Role.ADMIN,
    Status.CANCELLED: Role.ADMIN,
}


def allowed_next_statuses(current_status: Status) -> set[Status]:
    return ALLOWED_TRANSITIONS.get(current_status, set())


def is_allowed_transition(current_status: Status, to_status: Status) -> bool:
    return to_status in allowed_next_statuses(current_status)


def role_can_transition(role: Role, to_status: Status) -> bool:
    allowed = ROLE_ALLOWED_TO_STATUS.get(role, set())
    return to_status in allowed


def requires_override(current_status: Status, to_status: Status) -> bool:
    if to_status in {Status.ON_HOLD, Status.CANCELLED}:
        return True
    if current_status in TERMINAL_STATUSES:
        return True
    return not is_allowed_transition(current_status, to_status)


def is_terminal(status: Status) -> bool:
    return status in TERMINAL_STATUSES


def next_logical_statuses(previous_status: Status) -> set[Status]:
    return allowed_next_statuses(previous_status)
