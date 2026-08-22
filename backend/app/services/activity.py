from typing import Any

from sqlalchemy.orm import Session

from app import models
from app.utils import utcnow


def log_activity(
    db: Session,
    user_id: str,
    job_id: str | None,
    type: str,
    message: str,
    meta: dict[str, Any] | None = None,
) -> models.Activity:
    activity = models.Activity(user_id=user_id, job_id=job_id, type=type, message=message, meta=meta)
    db.add(activity)
    db.flush()
    return activity


def touch_job_activity(job: models.Job) -> None:
    job.last_activity_at = utcnow()
