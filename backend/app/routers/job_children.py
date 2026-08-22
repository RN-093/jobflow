from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user
from app.errors import not_found
from app.services.activity import log_activity, touch_job_activity
from app.services.ownership import get_owned_job
from app.utils import utcnow

router = APIRouter(prefix="/jobs/{job_id}", tags=["job-children"])


def _get_child(db: Session, model, child_id: str, job_id: str):
    obj = db.query(model).filter(model.id == child_id, model.job_id == job_id).first()
    if obj is None:
        raise not_found("Not found")
    return obj


# ---------- Timeline ----------


@router.get("/timeline", response_model=list[schemas.ActivityOut])
def get_timeline(
    job_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
) -> list[models.Activity]:
    get_owned_job(db, job_id, current_user.id)
    return (
        db.query(models.Activity)
        .filter(models.Activity.job_id == job_id, models.Activity.user_id == current_user.id)
        .order_by(models.Activity.created_at.desc())
        .all()
    )


# ---------- Interviews ----------


@router.get("/interviews", response_model=list[schemas.InterviewOut])
def list_interviews(
    job_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
) -> list[models.Interview]:
    get_owned_job(db, job_id, current_user.id)
    return (
        db.query(models.Interview)
        .filter(models.Interview.job_id == job_id)
        .order_by(models.Interview.scheduled_at)
        .all()
    )


@router.post("/interviews", response_model=schemas.InterviewOut, status_code=201)
def create_interview(
    job_id: str,
    payload: schemas.InterviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.Interview:
    job = get_owned_job(db, job_id, current_user.id)
    interview = models.Interview(
        user_id=current_user.id, job_id=job_id, status="scheduled", **payload.model_dump()
    )
    db.add(interview)
    touch_job_activity(job)
    db.flush()
    log_activity(
        db,
        current_user.id,
        job_id,
        "interview_created",
        f"{payload.type_label} scheduled for {job.title} at {job.company}",
    )
    db.commit()
    db.refresh(interview)
    return interview


@router.patch("/interviews/{child_id}", response_model=schemas.InterviewOut)
def update_interview(
    job_id: str,
    child_id: str,
    payload: schemas.InterviewPatch,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.Interview:
    job = get_owned_job(db, job_id, current_user.id)
    interview = _get_child(db, models.Interview, child_id, job_id)

    updates = payload.model_dump(exclude_unset=True)
    became_completed = updates.get("status") == "completed" and interview.status != "completed"
    for field, value in updates.items():
        setattr(interview, field, value)

    touch_job_activity(job)
    if became_completed:
        log_activity(
            db,
            current_user.id,
            job_id,
            "interview_completed",
            f"{interview.type_label} for {job.title} at {job.company} completed",
        )

    db.commit()
    db.refresh(interview)
    return interview


@router.delete("/interviews/{child_id}", status_code=204)
def delete_interview(
    job_id: str,
    child_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> None:
    job = get_owned_job(db, job_id, current_user.id)
    interview = _get_child(db, models.Interview, child_id, job_id)
    db.delete(interview)
    touch_job_activity(job)
    db.commit()


# ---------- Contacts ----------


@router.get("/contacts", response_model=list[schemas.ContactOut])
def list_contacts(
    job_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
) -> list[models.Contact]:
    get_owned_job(db, job_id, current_user.id)
    return db.query(models.Contact).filter(models.Contact.job_id == job_id).order_by(models.Contact.name).all()


@router.post("/contacts", response_model=schemas.ContactOut, status_code=201)
def create_contact(
    job_id: str,
    payload: schemas.ContactCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.Contact:
    job = get_owned_job(db, job_id, current_user.id)
    contact = models.Contact(job_id=job_id, **payload.model_dump())
    db.add(contact)
    touch_job_activity(job)
    db.flush()
    log_activity(db, current_user.id, job_id, "contact_added", f"{contact.name} added as a contact")
    db.commit()
    db.refresh(contact)
    return contact


@router.patch("/contacts/{child_id}", response_model=schemas.ContactOut)
def update_contact(
    job_id: str,
    child_id: str,
    payload: schemas.ContactPatch,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.Contact:
    job = get_owned_job(db, job_id, current_user.id)
    contact = _get_child(db, models.Contact, child_id, job_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    touch_job_activity(job)
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/contacts/{child_id}", status_code=204)
def delete_contact(
    job_id: str,
    child_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> None:
    job = get_owned_job(db, job_id, current_user.id)
    contact = _get_child(db, models.Contact, child_id, job_id)
    name = contact.name
    db.delete(contact)
    touch_job_activity(job)
    log_activity(db, current_user.id, job_id, "contact_removed", f"{name} removed as a contact")
    db.commit()


# ---------- Tasks ----------


@router.get("/tasks", response_model=list[schemas.TaskOut])
def list_tasks(
    job_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
) -> list[models.Task]:
    get_owned_job(db, job_id, current_user.id)
    return db.query(models.Task).filter(models.Task.job_id == job_id).order_by(models.Task.due_date).all()


@router.post("/tasks", response_model=schemas.TaskOut, status_code=201)
def create_task(
    job_id: str,
    payload: schemas.TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.Task:
    job = get_owned_job(db, job_id, current_user.id)
    task = models.Task(user_id=current_user.id, job_id=job_id, **payload.model_dump())
    db.add(task)
    touch_job_activity(job)
    db.flush()
    log_activity(db, current_user.id, job_id, "task_created", f"Task '{task.title}' added")
    db.commit()
    db.refresh(task)
    return task


@router.patch("/tasks/{child_id}", response_model=schemas.TaskOut)
def update_task(
    job_id: str,
    child_id: str,
    payload: schemas.TaskPatch,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.Task:
    job = get_owned_job(db, job_id, current_user.id)
    task = _get_child(db, models.Task, child_id, job_id)

    updates = payload.model_dump(exclude_unset=True)
    became_completed = updates.get("completed") is True and not task.completed
    for field, value in updates.items():
        setattr(task, field, value)
    if became_completed:
        task.completed_at = utcnow()

    touch_job_activity(job)
    if became_completed:
        log_activity(db, current_user.id, job_id, "task_completed", f"Task '{task.title}' completed")

    db.commit()
    db.refresh(task)
    return task


@router.delete("/tasks/{child_id}", status_code=204)
def delete_task(
    job_id: str,
    child_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> None:
    job = get_owned_job(db, job_id, current_user.id)
    task = _get_child(db, models.Task, child_id, job_id)
    db.delete(task)
    touch_job_activity(job)
    db.commit()


# ---------- Notes ----------


@router.get("/notes", response_model=list[schemas.NoteOut])
def list_notes(
    job_id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
) -> list[models.Note]:
    get_owned_job(db, job_id, current_user.id)
    return (
        db.query(models.Note).filter(models.Note.job_id == job_id).order_by(models.Note.created_at.desc()).all()
    )


@router.post("/notes", response_model=schemas.NoteOut, status_code=201)
def create_note(
    job_id: str,
    payload: schemas.NoteCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.Note:
    job = get_owned_job(db, job_id, current_user.id)
    note = models.Note(job_id=job_id, **payload.model_dump())
    db.add(note)
    touch_job_activity(job)
    db.flush()
    log_activity(db, current_user.id, job_id, "note_added", "Note added")
    db.commit()
    db.refresh(note)
    return note


@router.patch("/notes/{child_id}", response_model=schemas.NoteOut)
def update_note(
    job_id: str,
    child_id: str,
    payload: schemas.NotePatch,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> models.Note:
    job = get_owned_job(db, job_id, current_user.id)
    note = _get_child(db, models.Note, child_id, job_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(note, field, value)
    touch_job_activity(job)
    db.commit()
    db.refresh(note)
    return note


@router.delete("/notes/{child_id}", status_code=204)
def delete_note(
    job_id: str,
    child_id: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> None:
    job = get_owned_job(db, job_id, current_user.id)
    note = _get_child(db, models.Note, child_id, job_id)
    db.delete(note)
    touch_job_activity(job)
    db.commit()
