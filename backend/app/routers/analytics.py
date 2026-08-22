from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user
from app.services.analytics_math import safe_pct

router = APIRouter(prefix="/analytics", tags=["analytics"])


def _month_str(d) -> str:
    return d.strftime("%Y-%m")


@router.get("", response_model=schemas.AnalyticsOut)
def get_analytics(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
) -> schemas.AnalyticsOut:
    user_id = current_user.id

    all_jobs = db.query(models.Job).filter(models.Job.user_id == user_id).all()
    applied_jobs = [j for j in all_jobs if j.date_applied is not None]
    offer_jobs = [j for j in all_jobs if j.offer_date is not None]

    jobs_with_interview_ids = {
        r[0]
        for r in db.query(models.Interview.job_id).filter(models.Interview.user_id == user_id).distinct().all()
    }

    month_counts: dict[str, int] = {}
    for job in applied_jobs:
        m = _month_str(job.date_applied)
        month_counts[m] = month_counts.get(m, 0) + 1
    applications_over_time = [schemas.MonthCount(month=m, count=c) for m, c in sorted(month_counts.items())]

    sources = db.query(models.JobSource).filter(models.JobSource.user_id == user_id).order_by(models.JobSource.name).all()
    jobs_by_source: dict[str, list[models.Job]] = {}
    for job in all_jobs:
        if job.source_id:
            jobs_by_source.setdefault(job.source_id, []).append(job)

    by_source = []
    for source in sources:
        jobs = jobs_by_source.get(source.id, [])
        applications = sum(1 for j in jobs if j.date_applied is not None)
        interviews = sum(1 for j in jobs if j.id in jobs_with_interview_ids)
        offers = sum(1 for j in jobs if j.offer_date is not None)
        by_source.append(
            schemas.SourceStat(
                source=source.name,
                applications=applications,
                interviews=interviews,
                offers=offers,
                conversion_pct=safe_pct(offers, applications),
            )
        )

    stages = (
        db.query(models.PipelineStage)
        .filter(models.PipelineStage.user_id == user_id)
        .order_by(models.PipelineStage.position)
        .all()
    )
    stage_job_counts = dict(
        db.query(models.Job.stage_id, func.count(models.Job.id))
        .filter(models.Job.user_id == user_id, models.Job.archived.is_(False))
        .group_by(models.Job.stage_id)
        .all()
    )
    by_stage = [schemas.StageJobCount(stage=s.name, jobs=stage_job_counts.get(s.id, 0)) for s in stages]

    interviews = db.query(models.Interview).filter(models.Interview.user_id == user_id).all()
    interview_month_counts: dict[str, int] = {}
    for interview in interviews:
        m = _month_str(interview.scheduled_at.date())
        interview_month_counts[m] = interview_month_counts.get(m, 0) + 1
    interviews_per_month = [schemas.MonthCount(month=m, count=c) for m, c in sorted(interview_month_counts.items())]

    offer_month_counts: dict[str, int] = {}
    for job in offer_jobs:
        m = _month_str(job.offer_date)
        offer_month_counts[m] = offer_month_counts.get(m, 0) + 1
    offers_per_month = [schemas.MonthCount(month=m, count=c) for m, c in sorted(offer_month_counts.items())]

    applied_ids = {j.id for j in applied_jobs}
    offer_ids = {j.id for j in offer_jobs}
    conversion_rates = schemas.ConversionRates(
        app_to_interview_pct=safe_pct(len(jobs_with_interview_ids & applied_ids), len(applied_ids)),
        interview_to_offer_pct=safe_pct(len(jobs_with_interview_ids & offer_ids), len(jobs_with_interview_ids)),
    )

    history = (
        db.query(models.JobStageHistory)
        .filter(models.JobStageHistory.user_id == user_id)
        .order_by(models.JobStageHistory.job_id, models.JobStageHistory.changed_at)
        .all()
    )
    by_job: dict[str, list[models.JobStageHistory]] = {}
    for h in history:
        by_job.setdefault(h.job_id, []).append(h)

    stage_durations: dict[str, list[float]] = {}
    for rows in by_job.values():
        for idx in range(len(rows) - 1):
            current_row, next_row = rows[idx], rows[idx + 1]
            if current_row.to_stage_name is None:
                continue
            days = (next_row.changed_at - current_row.changed_at).total_seconds() / 86400
            stage_durations.setdefault(current_row.to_stage_name, []).append(days)

    stage_position = {s.name: s.position for s in stages}
    avg_days_per_stage = sorted(
        (
            schemas.StageAvgDays(stage_name=name, avg_days=round(sum(vals) / len(vals), 1))
            for name, vals in stage_durations.items()
        ),
        key=lambda item: stage_position.get(item.stage_name, 999),
    )

    return schemas.AnalyticsOut(
        applications_over_time=applications_over_time,
        by_source=by_source,
        by_stage=by_stage,
        interviews_per_month=interviews_per_month,
        offers_per_month=offers_per_month,
        conversion_rates=conversion_rates,
        avg_days_per_stage=avg_days_per_stage,
    )
