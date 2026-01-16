from collections.abc import Iterable

from app.models import Role, Status
from app.utils.transitions import role_can_transition


def select_role_for_action(user_roles: Iterable[Role], preferred: Iterable[Role] | None = None) -> Role:
    roles = list(user_roles)
    if preferred:
        for role in preferred:
            if role in roles:
                return role
    if Role.ADMIN in roles:
        return Role.ADMIN
    return roles[0]


def select_role_for_status(user_roles: Iterable[Role], target_status: Status) -> Role:
    roles = list(user_roles)
    for role in roles:
        if role != Role.ADMIN and role_can_transition(role, target_status):
            return role
    if Role.ADMIN in roles:
        return Role.ADMIN
    return roles[0]
