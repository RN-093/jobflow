from datetime import date, datetime


def _as_datetime(value: date | datetime) -> datetime:
    if isinstance(value, datetime):
        return value
    return datetime.combine(value, datetime.min.time())


def avg_days(pairs: list[tuple[date | datetime | None, date | datetime | None]]) -> float | None:
    """Mean number of days between each (start, end) pair. Pairs with a missing
    side are dropped before computing — never fabricates a value from partial data."""
    deltas: list[float] = []
    for start, end in pairs:
        if start is None or end is None:
            continue
        deltas.append((_as_datetime(end) - _as_datetime(start)).total_seconds() / 86400)
    if not deltas:
        return None
    return round(sum(deltas) / len(deltas), 1)


def safe_pct(numerator: int, denominator: int) -> float | None:
    if not denominator:
        return None
    return round((numerator / denominator) * 100, 1)
