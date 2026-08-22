from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user
from app.services.analytics_math import avg_days, safe_pct
from app.utils import today, utcnow, week_start

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

ACTIVE_STAGE_TYPES = {"interested", "applied", "interview", "custom"}
STALE_THRESHOLD_DAYS = 14


def _stage_type_count(db: Session, user_id: str, stage_type: str) -> int:
    return (
        db.query(func.count(models.Job.id))
        .join(models.PipelineStage, models.PipelineStage.id == models.Job.stage_id)
        .filter(
            models.Job.user_id == user_id,
            models.Job.archived.is_(False),
            models.PipelineStage.stage_type == stage_type,
        )
        .scalar()
        or 0
    )


@router.get("", response_model=schemas.DashboardOut)
def get_dashboard(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
) -> schemas.DashboardOut:
    user_id = current_user.id
    now = utcnow()
    today_date = today()
    week_start_date = week_start(today_date)
    month_start_date = today_date.replace(day=1)

    total_active = (
        db.query(func.count(models.Job.id))
        .join(models.PipelineStage, models.PipelineStage.id == models.Job.stage_id)
        .filter(
            models.Job.user_id == user_id,
            models.Job.archived.is_(False),
            models.PipelineStage.stage_type.in_(ACTIVE_STAGE_TYPES),
        )
        .scalar()
        or 0
    )

    stats = schemas.DashboardStats(
        total_active=total_active,
        interested=_stage_type_count(db, user_id, "interested"),
        applied=_stage_type_count(db, user_id, "applied"),
        interviews=_stage_type_count(db, user_id, "interview"),
        offers=_stage_type_count(db, user_id, "offer"),
        rejected=_stage_type_count(db, user_id, "rejected"),
        withdrawn=_stage_type_count(db, user_id, "withdrawn"),
    )

    applications_this_week = (
        db.query(func.count(models.Job.id))
        .filter(models.Job.user_id == user_id, models.Job.date_applied >= week_start_date)
        .scalar()
        or 0
    )
    applications_this_month = (
        db.query(func.count(models.Job.id))
        .filter(models.Job.user_id == user_id, models.Job.date_applied >= month_start_date)
        .scalar()
        or 0
    )
    interviews_this_month = (
        db.query(func.count(models.Interview.id))
        .filter(
            models.Interview.user_id == user_id,
            func.date(models.Interview.scheduled_at) >= month_start_date,
        )
        .scalar()
        or 0
    )
    offers_received = (
        db.query(func.count(models.Job.id))
        .filter(models.Job.user_id == user_id, models.Job.offer_date.isnot(None))
        .scalar()
        or 0
    )

    applied_jobs = (
        db.query(models.Job).filter(models.Job.user_id == user_id, models.Job.date_applied.isnot(None)).all()
    )
    applied_job_ids = [j.id for j in applied_jobs]
    jobs_with_interview_ids: set[str] = set()
    if applied_job_ids:
        rows = (
            db.query(models.Interview.job_id)
            .filter(models.Interview.job_id.in_(applied_job_ids))
            .distinct()
            .all()
        )
        jobs_with_interview_ids = {r[0] for r in rows}

    all_jobs_with_interview_ids: set[str] = {
        r[0] for r in db.query(models.Interview.job_id).filter(models.Interview.user_id == user_id).distinct().all()
    }
    jobs_with_offer_ids = {
        j.id
        for j in db.query(models.Job)
        .filter(models.Job.user_id == user_id, models.Job.offer_date.isnot(None))
        .all()
    }

    app_to_interview_pct = safe_pct(len(jobs_with_interview_ids), len(applied_job_ids))
    interview_to_offer_pct = safe_pct(
        len(all_jobs_with_interview_ids & jobs_with_offer_ids), len(all_jobs_with_interview_ids)
    )

    first_interview_by_job: dict[str, object] = {}
    interview_rows = (
        db.query(models.Interview.job_id, func.min(models.Interview.scheduled_at))
        .filter(models.Interview.user_id == user_id)
        .group_by(models.Interview.job_id)
        .all()
    )
    first_interview_by_job = dict(interview_rows)

    apply_to_interview_pairs = [
        (job.date_applied, first_interview_by_job.get(job.id)) for job in applied_jobs
    ]
    apply_to_offer_pairs = [
        (job.date_applied, job.offer_date) for job in applied_jobs if job.offer_date is not None
    ]

    metrics = schemas.DashboardMetrics(
        applications_this_week=applications_this_week,
        applications_this_month=applications_this_month,
        interviews_this_month=interviews_this_month,
        offers_received=offers_received,
        app_to_interview_pct=app_to_interview_pct,
        interview_to_offer_pct=interview_to_offer_pct,
        avg_days_apply_to_first_interview=avg_days(apply_to_interview_pairs),
        avg_days_apply_to_offer=avg_days(apply_to_offer_pairs),
    )

    upcoming_interviews_raw = (
        db.query(models.Interview, models.Job)
        .join(models.Job, models.Job.id == models.Interview.job_id)
        .filter(
            models.Interview.user_id == user_id,
            models.Interview.status == "scheduled",
            models.Interview.scheduled_at >= now,
        )
        .order_by(models.Interview.scheduled_at)
        .limit(10)
        .all()
    )
    upcoming_interviews = [
        schemas.UpcomingInterview(
            id=i.id, job_id=j.id, job_title=j.title, company=j.company, scheduled_at=i.scheduled_at, type_label=i.type_label
        )
        for i, j in upcoming_interviews_raw
    ]

    overdue_tasks_raw = (
        db.query(models.Task, models.Job)
        .join(models.Job, models.Job.id == models.Task.job_id)
        .filter(
            models.Task.user_id == user_id,
            models.Task.completed.is_(False),
            models.Task.due_date.isnot(None),
            models.Task.due_date < today_date,
        )
        .order_by(models.Task.due_date)
        .all()
    )
    overdue_tasks = [
        schemas.UpcomingTask(id=t.id, job_id=j.id, job_title=j.title, company=j.company, title=t.title, due_date=t.due_date)
        for t, j in overdue_tasks_raw
    ]

    tasks_today_raw = (
        db.query(models.Task, models.Job)
        .join(models.Job, models.Job.id == models.Task.job_id)
        .filter(
            models.Task.user_id == user_id,
            models.Task.completed.is_(False),
            models.Task.due_date == today_date,
        )
        .all()
    )
    tasks_today = [
        schemas.UpcomingTask(id=t.id, job_id=j.id, job_title=j.title, company=j.company, title=t.title, due_date=t.due_date)
        for t, j in tasks_today_raw
    ]

    active_jobs_raw = (
        db.query(models.Job, models.PipelineStage)
        .join(models.PipelineStage, models.PipelineStage.id == models.Job.stage_id)
        .filter(
            models.Job.user_id == user_id,
            models.Job.archived.is_(False),
            models.PipelineStage.stage_type.in_(ACTIVE_STAGE_TYPES),
        )
        .all()
    )
    attention: list[schemas.AttentionJob] = []
    for job, stage in active_jobs_raw:
        stale = (now - job.last_activity_at).days > STALE_THRESHOLD_DAYS - 1
        due_follow_up = job.follow_up_date is not None and job.follow_up_date <= today_date
        if stale or due_follow_up:
            attention.append(
                schemas.AttentionJob(
                    id=job.id,
                    title=job.title,
                    company=job.company,
                    stage_name=stage.name,
                    follow_up_date=job.follow_up_date,
                    last_activity_at=job.last_activity_at,
                )
            )

    recent_activity = (
        db.query(models.Activity)
        .filter(models.Activity.user_id == user_id)
        .order_by(models.Activity.created_at.desc())
        .limit(12)
        .all()
    )

    return schemas.DashboardOut(
        stats=stats,
        metrics=metrics,
        upcoming=schemas.DashboardUpcoming(
            interviews=upcoming_interviews,
            overdue_tasks=overdue_tasks,
            tasks_today=tasks_today,
            attention=attention,
        ),
        recent_activity=[schemas.ActivityOut.model_validate(a) for a in recent_activity],
    )
