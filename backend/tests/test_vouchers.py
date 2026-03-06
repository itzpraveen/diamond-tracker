from app.utils.vouchers import format_voucher_code, next_voucher_sequence, parse_voucher_sequence


def test_format_voucher_code():
    assert format_voucher_code(2026, 3, 1) == "VCH-2026-03-001"


def test_parse_voucher_sequence_supports_new_and_legacy_codes():
    assert parse_voucher_sequence("VCH-2026-03-004", year=2026, month=3) == 4
    assert parse_voucher_sequence("BATCH-2026-03-009", year=2026, month=3) == 9
    assert parse_voucher_sequence("BATCH-2026-03", year=2026, month=3) == 1
    assert parse_voucher_sequence("BATCH-2026-04", year=2026, month=3) is None


def test_next_voucher_sequence_ignores_other_months_and_bad_codes():
    codes = [
        "BATCH-2026-03",
        "VCH-2026-03-002",
        "BATCH-2026-03-010",
        "VCH-2026-04-001",
        "INVALID",
    ]
    assert next_voucher_sequence(codes, year=2026, month=3) == 11
