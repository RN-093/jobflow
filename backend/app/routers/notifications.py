from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user
from app.errors import not_found
from app.services.notify import refresh_notifications

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[schemas.NotificationOut])
def list_notifications(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
) -> list[models.Notification]:
    refresh_notifications(db, current_user.id)
    return (
        db.query(models.Notification)
        .filter(models.Notification.user_id == current_user.id)
        .order_by(models.Notification.read.asc(), models.Notification.created_at.desc())
        .limit(50)
        .all()
    )


@router.patch("/{notification_id}", response_model=schemas.NotificationOut)
def update_notification(
    notification_id: str,
    payload: schemas.NotificationPatch,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.Notification:
    notification = (
        db.query(models.Notification)
        .filter(models.Notification.id == notification_id, models.Notification.user_id == current_user.id)
        .first()
    )
    if notification is None:
        raise not_found("Notification not found")
    notification.read = payload.read
    db.commit()
    db.refresh(notification)
    return notification
