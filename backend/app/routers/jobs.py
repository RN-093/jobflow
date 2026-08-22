from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user
from app.errors import not_found
from app.services.activity import log_activity, touch_job_activity
from app.services.defaults import get_interested_stage
from app.services.ownership import get_owned_job
from app.services.positions import append_to_stage, move_job
from app.services.serializers import JobCtx, job_to_card, job_to_detail
from app.utils import utcnow

router = APIRouter(prefix="/jobs", tags=["jobs"])

SORT_COLUMNS = {
    "last_activity": models.Job.last_activity_at,
    "applied": models.Job.date_applied,
    "created": models.Job.created_at,
    "company": models.Job.company,
    "salary": models.Job.salary_min,
}

BUSINESS_FIELDS = [
    "title",
    "company",
    "company_website",
    "posting_url",
    "location",
    "remote_status",
    "employment_type",
    "salary_min",
    "salary_max",
    "salary_currency",
    "salary_period",
    "description",
    "reference_id",
    "source_id",
    "date_sourced",
    "date_applied",
    "deadline",
    "follow_up_date",
    "offer_date",
    "rejection_date",
]


def _apply_search(query, db: Session, q: str):
    like = f"%{q}%"
    contact_match = (
        db.query(models.Contact.id)
        .filter(
            models.Contact.job_id == models.Job.id,
            or_(models.Contact.name.ilike(like), models.Contact.email.ilike(like)),
        )
        .exists()
    )
    note_match = (
        db.query(models.Note.id)
        .filter(models.Note.job_id == models.Job.id, models.Note.body.ilike(like))
        .exists()
    )
    return query.filter(
        or_(
            models.Job.title.ilike(like),
            models.Job.company.ilike(like),
            models.Job.location.ilike(like),
            contact_match,
            note_match,
        )
    )


@router.get("", response_model=schemas.Page[schemas.JobCard])
def list_jobs(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=1000),
    q: str | None = None,
    stage_id: str | None = None,
    company: str | None = None,
    location: str | None = None,
    remote_status: str | None = None,
    min_salary: int | None = None,
    applied_from: date | None = None,
    applied_to: date | None = None,
    sourced_from: date | None = None,
    sourced_to: date | None = None,
    has_interview: bool | None = None,
    overdue_tasks: bool | None = None,
    archived: bool = False,
    sort: str = "last_activity",
    order: str = "desc",
) -> schemas.Page[schemas.JobCard]:
    query = db.query(models.Job).filter(models.Job.user_id == current_user.id, models.Job.archived == archived)

    if q:
        query = _apply_search(query, db, q)
    if stage_id:
        stage_ids = [s.strip() for s in stage_id.split(",") if s.strip()]
        if stage_ids:
            query = query.filter(models.Job.stage_id.in_(stage_ids))
    if company:
        query = query.filter(models.Job.company.ilike(f"%{company}%"))
    if location:
        query = query.filter(models.Job.location.ilike(f"%{location}%"))
    if remote_status:
        query = query.filter(models.Job.remote_status == remote_status)
    if min_salary is not None:
        query = query.filter(models.Job.salary_max.isnot(None), models.Job.salary_max >= min_salary)
    if applied_from is not None:
        query = query.filter(models.Job.date_applied >= applied_from)
    if applied_to is not None:
        query = query.filter(models.Job.date_applied <= applied_to)
    if sourced_from is not None:
        query = query.filter(models.Job.date_sourced >= sourced_from)
    if sourced_to is not None:
        query = query.filter(models.Job.date_sourced <= sourced_to)
    if has_interview is not None:
        interview_exists = (
            db.query(models.Interview.id).filter(models.Interview.job_id == models.Job.id).exists()
        )
        query = query.filter(interview_exists if has_interview else ~interview_exists)
    if overdue_tasks is not None:
        overdue_exists = (
            db.query(models.Task.id)
            .filter(
                models.Task.job_id == models.Job.id,
                models.Task.completed.is_(False),
                models.Task.due_date.isnot(None),
                models.Task.due_date < utcnow().date(),
            )
            .exists()
        )
        query = query.filter(overdue_exists if overdue_tasks else ~overdue_exists)

    total = query.count()

    sort_column = SORT_COLUMNS.get(sort, models.Job.last_activity_at)
    sort_column = sort_column.desc() if order == "desc" else sort_column.asc()
    jobs = query.order_by(sort_column).offset((page - 1) * page_size).limit(page_size).all()

    ctx = JobCtx.build(db, current_user.id, jobs)
    items = [job_to_card(job, ctx) for job in jobs]

    return schemas.Page(items=items, total=total, page=page, page_size=page_size)


@router.post("", response_model=schemas.JobDetail, status_code=201)
def create_job(
    payload: schemas.JobCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.JobDetail:
    if payload.stage_id:
        stage = (
            db.query(models.PipelineStage)
            .filter(models.PipelineStage.id == payload.stage_id, models.PipelineStage.user_id == current_user.id)
            .first()
        )
        if stage is None:
            raise not_found("Stage not found")
    else:
        stage = get_interested_stage(db, current_user.id)
        if stage is None:
            raise not_found("Default 'Interested' stage not found")

    if payload.source_id:
        source = (
            db.query(models.JobSource)
            .filter(models.JobSource.id == payload.source_id, models.JobSource.user_id == current_user.id)
            .first()
        )
        if source is None:
            raise not_found("Source not found")

    now = utcnow()
    data = payload.model_dump(exclude={"stage_id"})
    job = models.Job(
        user_id=current_user.id,
        stage_id=stage.id,
        entered_stage_at=now,
        last_activity_at=now,
        **data,
    )
    db.add(job)
    db.flush()

    append_to_stage(db, job, stage.id)

    db.add(
        models.JobStageHistory(
            user_id=current_user.id,
            job_id=job.id,
            from_stage_id=None,
            to_stage_id=stage.id,
            from_stage_name=None,
            to_stage_name=stage.name,
            changed_at=now,
        )
    )
    log_activity(db, current_user.id, job.id, "job_created", f"{job.title} at {job.company} added")

    db.commit()
    db.refresh(job)

    ctx = JobCtx.build(db, current_user.id, [job])
    return job_to_detail(job, ctx)


@router.get("/{job_id}", response_model=schemas.JobDetail)
def get_job(
    job_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
) -> schemas.JobDetail:
    job = get_owned_job(db, job_id, current_user.id)
    ctx = JobCtx.build(db, current_user.id, [job])
    return job_to_detail(job, ctx)


@router.patch("/{job_id}", response_model=schemas.JobDetail)
def update_job(
    job_id: str,
    payload: schemas.JobPatch,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.JobDetail:
    job = get_owned_job(db, job_id, current_user.id)
    updates = payload.model_dump(exclude_unset=True)

    archived = updates.pop("archived", None)

    if updates.get("source_id"):
        source = (
            db.query(models.JobSource)
            .filter(models.JobSource.id == updates["source_id"], models.JobSource.user_id == current_user.id)
            .first()
        )
        if source is None:
            raise not_found("Source not found")

    changed = False
    for field in BUSINESS_FIELDS:
        if field in updates and getattr(job, field) != updates[field]:
            setattr(job, field, updates[field])
            changed = True

    if changed:
        touch_job_activity(job)
        log_activity(db, current_user.id, job.id, "job_edited", f"{job.title} at {job.company} updated")

    if archived is not None and archived != job.archived:
        job.archived = archived
        touch_job_activity(job)
        if archived:
            log_activity(db, current_user.id, job.id, "job_archived", f"{job.title} at {job.company} archived")
        else:
            log_activity(db, current_user.id, job.id, "job_restored", f"{job.title} at {job.company} restored")

    db.commit()
    db.refresh(job)

    ctx = JobCtx.build(db, current_user.id, [job])
    return job_to_detail(job, ctx)


@router.delete("/{job_id}", status_code=204)
def delete_job(
    job_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
) -> None:
    job = get_owned_job(db, job_id, current_user.id)
    db.delete(job)
    db.commit()


@router.patch("/{job_id}/archive", response_model=schemas.JobDetail)
def archive_job(
    job_id: str,
    payload: schemas.ArchiveIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.JobDetail:
    job = get_owned_job(db, job_id, current_user.id)
    if payload.archived != job.archived:
        job.archived = payload.archived
        touch_job_activity(job)
        if payload.archived:
            log_activity(db, current_user.id, job.id, "job_archived", f"{job.title} at {job.company} archived")
        else:
            log_activity(db, current_user.id, job.id, "job_restored", f"{job.title} at {job.company} restored")
    db.commit()
    db.refresh(job)

    ctx = JobCtx.build(db, current_user.id, [job])
    return job_to_detail(job, ctx)


@router.patch("/{job_id}/stage", response_model=schemas.JobDetail)
def move_job_stage(
    job_id: str,
    payload: schemas.StageMoveIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.JobDetail:
    job = get_owned_job(db, job_id, current_user.id)

    target_stage = (
        db.query(models.PipelineStage)
        .filter(models.PipelineStage.id == payload.stage_id, models.PipelineStage.user_id == current_user.id)
        .first()
    )
    if target_stage is None:
        raise not_found("Stage not found")

    from_stage = (
        db.query(models.PipelineStage)
        .filter(models.PipelineStage.id == job.stage_id, models.PipelineStage.user_id == current_user.id)
        .first()
    )

    now = utcnow()
    move_job(db, job, target_stage.id, position=payload.position, before_id=payload.before_id)
    job.entered_stage_at = now
    touch_job_activity(job)

    db.add(
        models.JobStageHistory(
            user_id=current_user.id,
            job_id=job.id,
            from_stage_id=from_stage.id if from_stage else None,
            to_stage_id=target_stage.id,
            from_stage_name=from_stage.name if from_stage else None,
            to_stage_name=target_stage.name,
            changed_at=now,
            note=payload.note,
        )
    )
    log_activity(
        db,
        current_user.id,
        job.id,
        "stage_changed",
        f"{job.company} moved to {target_stage.name}",
        meta={"from": from_stage.name if from_stage else None, "to": target_stage.name},
    )

    db.commit()
    db.refresh(job)

    ctx = JobCtx.build(db, current_user.id, [job])
    return job_to_detail(job, ctx)
