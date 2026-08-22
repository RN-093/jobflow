from sqlalchemy.orm import Session

from app import models


def _column_jobs(db: Session, user_id: str, stage_id: str, exclude_job_id: str | None = None) -> list[models.Job]:
    query = (
        db.query(models.Job)
        .filter(models.Job.user_id == user_id, models.Job.stage_id == stage_id)
        .order_by(models.Job.position)
    )
    jobs = query.all()
    if exclude_job_id:
        jobs = [j for j in jobs if j.id != exclude_job_id]
    return jobs


def _renumber(jobs: list[models.Job]) -> None:
    for index, job in enumerate(jobs):
        job.position = index


def append_to_stage(db: Session, job: models.Job, stage_id: str) -> None:
    existing = _column_jobs(db, job.user_id, stage_id, exclude_job_id=job.id)
    job.stage_id = stage_id
    job.position = len(existing)


def move_job(
    db: Session,
    job: models.Job,
    target_stage_id: str,
    position: int | None = None,
    before_id: str | None = None,
) -> None:
    source_stage_id = job.stage_id
    same_column = source_stage_id == target_stage_id

    target_jobs = _column_jobs(db, job.user_id, target_stage_id, exclude_job_id=job.id)

    if before_id is not None:
        index = next((i for i, j in enumerate(target_jobs) if j.id == before_id), len(target_jobs))
    elif position is not None:
        index = max(0, min(position, len(target_jobs)))
    else:
        index = len(target_jobs)

    target_jobs.insert(index, job)
    job.stage_id = target_stage_id
    _renumber(target_jobs)

    if not same_column:
        source_jobs = _column_jobs(db, job.user_id, source_stage_id, exclude_job_id=job.id)
        _renumber(source_jobs)

    db.flush()


def reorder_stages(db: Session, user_id: str, ordered_ids: list[str]) -> None:
    stages = {s.id: s for s in db.query(models.PipelineStage).filter(models.PipelineStage.user_id == user_id)}
    for index, stage_id in enumerate(ordered_ids):
        stage = stages.get(stage_id)
        if stage is not None:
            stage.position = index
    db.flush()
