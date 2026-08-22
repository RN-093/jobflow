from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user

router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("", response_model=list[schemas.CalendarEvent])
def get_calendar(
    year: int = Query(...),
    month: int = Query(..., ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> list[schemas.CalendarEvent]:
    user_id = current_user.id
    events: list[schemas.CalendarEvent] = []

    interviews = (
        db.query(models.Interview, models.Job)
        .join(models.Job, models.Job.id == models.Interview.job_id)
        .filter(models.Interview.user_id == user_id)
        .all()
    )
    for interview, job in interviews:
        d = interview.scheduled_at.date()
        if d.year == year and d.month == month:
            events.append(
                schemas.CalendarEvent(
                    date=d,
                    type="interview",
                    label=f"{interview.type_label} — {job.company}",
                    time=interview.scheduled_at,
                    job_id=job.id,
                    job_title=job.title,
                    job_company=job.company,
                )
            )

    jobs = db.query(models.Job).filter(models.Job.user_id == user_id).all()
    for job in jobs:
        if job.deadline and job.deadline.year == year and job.deadline.month == month:
            events.append(
                schemas.CalendarEvent(
                    date=job.deadline,
                    type="deadline",
                    label=f"Deadline — {job.company}",
                    time=None,
                    job_id=job.id,
                    job_title=job.title,
                    job_company=job.company,
                )
            )
        if job.follow_up_date and job.follow_up_date.year == year and job.follow_up_date.month == month:
            events.append(
                schemas.CalendarEvent(
                    date=job.follow_up_date,
                    type="follow_up",
                    label=f"Follow up — {job.company}",
                    time=None,
                    job_id=job.id,
                    job_title=job.title,
                    job_company=job.company,
                )
            )

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
        if task.due_date.year == year and task.due_date.month == month:
            events.append(
                schemas.CalendarEvent(
                    date=task.due_date,
                    type="task",
                    label=task.title,
                    time=None,
                    job_id=job.id,
                    job_title=job.title,
                    job_company=job.company,
                )
            )

    events.sort(key=lambda e: (e.date, e.time or datetime.min))
    return events
