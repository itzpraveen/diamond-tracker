def diamond_carat_value(value: float | int | None) -> float | None:
    """Normalize stored diamond weight to carats.

    Legacy records commonly store "30" for 30 cents, while some newer inputs
    already arrive as carats like "0.30". Preserve decimal-style carat inputs
    and convert whole-number cent inputs to carats.
    """

    if value is None:
        return None

    numeric = float(value)
    if numeric == 0:
        return 0.0
    if numeric.is_integer():
        return numeric / 100
    return numeric


def format_diamond_carat(value: float | int | None) -> str:
    carat = diamond_carat_value(value)
    if carat is None:
        return "-"
    formatted = f"{carat:.3f}".rstrip("0").rstrip(".")
    return f"{formatted} ct"
