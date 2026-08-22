from sqlalchemy.orm import Session

from app import models
from app.errors import not_found


def get_owned_job(db: Session, job_id: str, user_id: str) -> models.Job:
    job = (
        db.query(models.Job)
        .filter(models.Job.id == job_id, models.Job.user_id == user_id)
        .first()
    )
    if job is None:
        raise not_found("Job not found")
    return job


def get_owned_stage(db: Session, stage_id: str, user_id: str) -> models.PipelineStage:
    stage = (
        db.query(models.PipelineStage)
        .filter(models.PipelineStage.id == stage_id, models.PipelineStage.user_id == user_id)
        .first()
    )
    if stage is None:
        raise not_found("Stage not found")
    return stage
