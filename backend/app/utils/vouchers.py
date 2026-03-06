from __future__ import annotations

import re
from collections.abc import Iterable

VOUCHER_PREFIX = "VCH"

_VOUCHER_CODE_RE = re.compile(
    r"^(?:VCH|VOUCHER)-(?P<year>\d{4})-(?P<month>\d{2})-(?P<sequence>\d{3})$"
)
_LEGACY_BATCH_CODE_RE = re.compile(
    r"^BATCH-(?P<year>\d{4})-(?P<month>\d{2})(?:-(?P<sequence>\d{3}))?$"
)


def format_voucher_code(year: int, month: int, sequence: int) -> str:
    return f"{VOUCHER_PREFIX}-{year}-{month:02d}-{sequence:03d}"


def parse_voucher_sequence(code: str, *, year: int, month: int) -> int | None:
    for pattern in (_VOUCHER_CODE_RE, _LEGACY_BATCH_CODE_RE):
        match = pattern.fullmatch(code.strip())
        if not match:
            continue
        if int(match.group("year")) != year or int(match.group("month")) != month:
            return None
        sequence = match.groupdict().get("sequence")
        if sequence:
            return int(sequence)
        return 1
    return None


def next_voucher_sequence(codes: Iterable[str], *, year: int, month: int) -> int:
    highest = 0
    for code in codes:
        sequence = parse_voucher_sequence(code, year=year, month=month)
        if sequence is not None and sequence > highest:
            highest = sequence
    return highest + 1
