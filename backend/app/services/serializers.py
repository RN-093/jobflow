from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.utils import today, utcnow


@dataclass
class JobCtx:
    """Batch-precomputed lookups so listing N jobs never does N extra queries."""

    stages: dict[str, models.PipelineStage]
    sources: dict[str, models.JobSource]
    next_interview: dict[str, datetime]
    overdue_tasks: dict[str, int]

    @classmethod
    def build(cls, db: Session, user_id: str, jobs: list[models.Job]) -> JobCtx:
        job_ids = [j.id for j in jobs]

        stages = {s.id: s for s in db.query(models.PipelineStage).filter(models.PipelineStage.user_id == user_id)}
        sources = {s.id: s for s in db.query(models.JobSource).filter(models.JobSource.user_id == user_id)}

        next_interview: dict[str, datetime] = {}
        overdue_tasks: dict[str, int] = {}

        if job_ids:
            interview_rows = (
                db.query(models.Interview.job_id, func.min(models.Interview.scheduled_at))
                .filter(
                    models.Interview.job_id.in_(job_ids),
                    models.Interview.status == "scheduled",
                    models.Interview.scheduled_at >= utcnow(),
                )
                .group_by(models.Interview.job_id)
                .all()
            )
            next_interview = dict(interview_rows)

            task_rows = (
                db.query(models.Task.job_id, func.count(models.Task.id))
                .filter(
                    models.Task.job_id.in_(job_ids),
                    models.Task.completed.is_(False),
                    models.Task.due_date.isnot(None),
                    models.Task.due_date < today(),
                )
                .group_by(models.Task.job_id)
                .all()
            )
            overdue_tasks = dict(task_rows)

        return cls(stages=stages, sources=sources, next_interview=next_interview, overdue_tasks=overdue_tasks)


def job_to_card(job: models.Job, ctx: JobCtx) -> schemas.JobCard:
    stage = ctx.stages.get(job.stage_id)
    source = ctx.sources.get(job.source_id) if job.source_id else None
    return schemas.JobCard(
        id=job.id,
        stage_id=job.stage_id,
        source_id=job.source_id,
        position=job.position,
        title=job.title,
        company=job.company,
        location=job.location,
        remote_status=job.remote_status,
        employment_type=job.employment_type,
        salary_min=job.salary_min,
        salary_max=job.salary_max,
        salary_currency=job.salary_currency,
        salary_period=job.salary_period,
        date_sourced=job.date_sourced,
        date_applied=job.date_applied,
        deadline=job.deadline,
        follow_up_date=job.follow_up_date,
        archived=job.archived,
        entered_stage_at=job.entered_stage_at,
        last_activity_at=job.last_activity_at,
        created_at=job.created_at,
        next_interview_at=ctx.next_interview.get(job.id),
        overdue_task_count=ctx.overdue_tasks.get(job.id, 0),
        stage_name=stage.name if stage else None,
        stage_type=stage.stage_type if stage else None,
        source_name=source.name if source else None,
    )


def job_to_detail(job: models.Job, ctx: JobCtx) -> schemas.JobDetail:
    card = job_to_card(job, ctx)
    return schemas.JobDetail(
        **card.model_dump(),
        company_website=job.company_website,
        posting_url=job.posting_url,
        description=job.description,
        reference_id=job.reference_id,
        offer_date=job.offer_date,
        rejection_date=job.rejection_date,
        updated_at=job.updated_at,
    )


def stage_to_out(stage: models.PipelineStage, job_count: int) -> schemas.StageOut:
    return schemas.StageOut(
        id=stage.id,
        name=stage.name,
        position=stage.position,
        color=stage.color,
        stage_type=stage.stage_type,
        is_default=stage.is_default,
        created_at=stage.created_at,
        job_count=job_count,
    )
