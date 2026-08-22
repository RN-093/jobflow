import uuid
from datetime import date, datetime, timedelta


def new_id() -> str:
    return uuid.uuid4().hex


def utcnow() -> datetime:
    return datetime.utcnow()


def today() -> date:
    return datetime.utcnow().date()


def week_start(d: date | None = None) -> date:
    d = d or today()
    return d - timedelta(days=d.weekday())
