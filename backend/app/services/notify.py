from datetime import timedelta

from sqlalchemy.orm import Session

from app import models
from app.utils import today, utcnow

ACTIVE_STAGE_TYPES = {"interested", "applied", "interview", "custom"}
STALE_THRESHOLD_DAYS = 14
INTERVIEW_SOON_WINDOW = timedelta(hours=24)
TRACKED_TYPES = {"task_overdue", "task_due_today", "interview_soon", "job_stale"}


def _current_conditions(db: Session, user_id: str) -> dict[str, tuple[str, str, str | None, object | None]]:
    """{key: (type, message, job_id, due_at)} for every reminder condition currently true."""
    conditions: dict[str, tuple[str, str, str | None, object | None]] = {}

    now = utcnow()
    today_date = today()

    tasks = (
        db.query(models.Task, models.Job)
        .join(models.Job, models.Job.id == models.Task.job_id)
        .filter(
            models.Task.user_id == user_id,
            models.Task.completed.is_(False),
            models.Task.due_date.isnot(None),
        )
        .all()
    )
    for task, job in tasks:
        if task.due_date < today_date:
            conditions[f"task_overdue:{task.id}"] = (
                "task_overdue",
                f"Task '{task.title}' for {job.company} is overdue",
                job.id,
                None,
            )
        elif task.due_date == today_date:
            conditions[f"task_due_today:{task.id}"] = (
                "task_due_today",
                f"Task '{task.title}' for {job.company} is due today",
                job.id,
                None,
            )

    interviews = (
        db.query(models.Interview, models.Job)
        .join(models.Job, models.Job.id == models.Interview.job_id)
        .filter(
            models.Interview.user_id == user_id,
            models.Interview.status == "scheduled",
            models.Interview.scheduled_at >= now,
            models.Interview.scheduled_at <= now + INTERVIEW_SOON_WINDOW,
        )
        .all()
    )
    for interview, job in interviews:
        conditions[f"interview_soon:{interview.id}"] = (
            "interview_soon",
            f"{interview.type_label} with {job.company} is coming up soon",
            job.id,
            interview.scheduled_at,
        )

    jobs = (
        db.query(models.Job, models.PipelineStage)
        .join(models.PipelineStage, models.PipelineStage.id == models.Job.stage_id)
        .filter(
            models.Job.user_id == user_id,
            models.Job.archived.is_(False),
            models.PipelineStage.stage_type.in_(ACTIVE_STAGE_TYPES),
        )
        .all()
    )
    for job, _stage in jobs:
        days_since = (now - job.last_activity_at).days
        if days_since >= STALE_THRESHOLD_DAYS:
            date_suffix = job.last_activity_at.strftime("%Y%m%d")
            conditions[f"job_stale:{job.id}:{date_suffix}"] = (
                "job_stale",
                f"{job.company} ({job.title}) has had no activity in {days_since} days",
                job.id,
                None,
            )

    return conditions


def refresh_notifications(db: Session, user_id: str) -> None:
    """Materializes reminder notifications, deduped by (user_id, key).

    Semantics: an existing row is left untouched once created (read state and
    created_at are never reset by a re-scan). A row whose condition has since
    cleared is deleted only if it has already been marked read — an unread
    reminder is never silently removed before the user has seen it.
    """
    current = _current_conditions(db, user_id)

    existing = (
        db.query(models.Notification)
        .filter(models.Notification.user_id == user_id, models.Notification.type.in_(TRACKED_TYPES))
        .all()
    )
    existing_keys = {n.key for n in existing}

    for notification in existing:
        if notification.key not in current and notification.read:
            db.delete(notification)

    for key, (type_, message, job_id, due_at) in current.items():
        if key not in existing_keys:
            db.add(
                models.Notification(
                    user_id=user_id,
                    key=key,
                    type=type_,
                    message=message,
                    job_id=job_id,
                    due_at=due_at,
                    read=False,
                )
            )

    db.commit()
