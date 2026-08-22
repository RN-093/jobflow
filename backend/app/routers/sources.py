from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user

router = APIRouter(prefix="/sources", tags=["sources"])


@router.get("", response_model=list[schemas.SourceOut])
def list_sources(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
) -> list[models.JobSource]:
    return (
        db.query(models.JobSource)
        .filter(models.JobSource.user_id == current_user.id)
        .order_by(models.JobSource.name)
        .all()
    )


@router.post("", response_model=schemas.SourceOut, status_code=201)
def create_source(
    payload: schemas.SourceIn,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.JobSource:
    existing = (
        db.query(models.JobSource)
        .filter(models.JobSource.user_id == current_user.id, models.JobSource.name == payload.name)
        .first()
    )
    if existing is not None:
        return existing

    source = models.JobSource(user_id=current_user.id, name=payload.name)
    db.add(source)
    db.commit()
    db.refresh(source)
    return source
