from app.models import Role, Status
from app.utils.transitions import is_allowed_transition, requires_override, role_can_transition


def test_happy_path_transitions():
    assert is_allowed_transition(Status.PURCHASED, Status.PACKED_READY)
    assert is_allowed_transition(Status.RECEIVED_AT_SHOP, Status.ADDED_TO_STOCK)


def test_invalid_transition_requires_override():
    assert not is_allowed_transition(Status.PURCHASED, Status.RECEIVED_AT_FACTORY)
    assert requires_override(Status.PURCHASED, Status.RECEIVED_AT_FACTORY)


def test_admin_override_required_for_cancel():
    assert requires_override(Status.PACKED_READY, Status.CANCELLED)


def test_role_permissions():
    assert role_can_transition(Role.PACKING, Status.PACKED_READY)
    assert not role_can_transition(Role.PACKING, Status.DISPATCHED_TO_FACTORY)
