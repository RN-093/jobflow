from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user
from app.errors import conflict
from app.services.defaults import DEFAULT_INTERVIEW_TYPES
from app.services.ownership import get_owned_stage
from app.services.positions import reorder_stages
from app.services.serializers import stage_to_out

router = APIRouter(prefix="/pipeline", tags=["pipeline"])
interview_types_router = APIRouter(tags=["pipeline"])


@router.get("/stages", response_model=list[schemas.StageOut])
def list_stages(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
) -> list[schemas.StageOut]:
    stages = (
        db.query(models.PipelineStage)
        .filter(models.PipelineStage.user_id == current_user.id)
        .order_by(models.PipelineStage.position)
        .all()
    )
    counts = dict(
        db.query(models.Job.stage_id, func.count(models.Job.id))
        .filter(models.Job.user_id == current_user.id)
        .group_by(models.Job.stage_id)
        .all()
    )
    return [stage_to_out(stage, counts.get(stage.id, 0)) for stage in stages]


@router.post("/stages", response_model=schemas.StageOut, status_code=201)
def create_stage(
    payload: schemas.StageIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.StageOut:
    existing = (
        db.query(models.PipelineStage)
        .filter(models.PipelineStage.user_id == current_user.id, models.PipelineStage.name == payload.name)
        .first()
    )
    if existing is not None:
        raise conflict("A stage with this name already exists")

    max_position = (
        db.query(func.max(models.PipelineStage.position))
        .filter(models.PipelineStage.user_id == current_user.id)
        .scalar()
    )
    stage = models.PipelineStage(
        user_id=current_user.id,
        name=payload.name,
        color=payload.color,
        stage_type=payload.stage_type,
        position=(max_position + 1) if max_position is not None else 0,
        is_default=False,
    )
    db.add(stage)
    db.commit()
    db.refresh(stage)
    return stage_to_out(stage, 0)


@router.patch("/stages/reorder", response_model=list[schemas.StageOut])
def reorder(
    payload: schemas.ReorderIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> list[schemas.StageOut]:
    reorder_stages(db, current_user.id, payload.ordered_ids)
    db.commit()

    stages = (
        db.query(models.PipelineStage)
        .filter(models.PipelineStage.user_id == current_user.id)
        .order_by(models.PipelineStage.position)
        .all()
    )
    counts = dict(
        db.query(models.Job.stage_id, func.count(models.Job.id))
        .filter(models.Job.user_id == current_user.id)
        .group_by(models.Job.stage_id)
        .all()
    )
    return [stage_to_out(stage, counts.get(stage.id, 0)) for stage in stages]


@router.patch("/stages/{stage_id}", response_model=schemas.StageOut)
def update_stage(
    stage_id: str,
    payload: schemas.StagePatch,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.StageOut:
    stage = get_owned_stage(db, stage_id, current_user.id)

    if payload.name is not None and payload.name != stage.name:
        existing = (
            db.query(models.PipelineStage)
            .filter(
                models.PipelineStage.user_id == current_user.id,
                models.PipelineStage.name == payload.name,
                models.PipelineStage.id != stage.id,
            )
            .first()
        )
        if existing is not None:
            raise conflict("A stage with this name already exists")
        stage.name = payload.name

    if payload.color is not None:
        stage.color = payload.color
    if payload.stage_type is not None:
        stage.stage_type = payload.stage_type

    db.commit()
    db.refresh(stage)

    job_count = (
        db.query(func.count(models.Job.id))
        .filter(models.Job.user_id == current_user.id, models.Job.stage_id == stage.id)
        .scalar()
    )
    return stage_to_out(stage, job_count or 0)


@router.delete("/stages/{stage_id}", status_code=204)
def delete_stage(
    stage_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> None:
    stage = get_owned_stage(db, stage_id, current_user.id)

    job_count = (
        db.query(func.count(models.Job.id))
        .filter(models.Job.user_id == current_user.id, models.Job.stage_id == stage.id)
        .scalar()
    ) or 0
    if job_count > 0:
        raise conflict(f"Stage contains {job_count} jobs — move them first")

    db.delete(stage)
    db.commit()


@interview_types_router.get("/interview-types", response_model=schemas.InterviewTypesOut)
def interview_types(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
) -> schemas.InterviewTypesOut:
    used = {
        row[0]
        for row in db.query(models.Interview.type_label).filter(models.Interview.user_id == current_user.id).all()
    }
    custom = sorted(label for label in used if label not in DEFAULT_INTERVIEW_TYPES)
    return schemas.InterviewTypesOut(defaults=DEFAULT_INTERVIEW_TYPES, custom=custom)
