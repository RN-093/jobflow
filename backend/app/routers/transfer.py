import csv
import io
import json
from datetime import date

from fastapi import APIRouter, Depends, File, Form, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.deps import get_current_user
from app.errors import validation_error
from app.services.activity import log_activity
from app.services.csv_io import (
    EXPORT_COLUMNS,
    build_export_row,
    is_duplicate,
    parse_row,
    suggest_mapping,
)
from app.services.defaults import get_interested_stage
from app.services.positions import append_to_stage
from app.utils import utcnow

router = APIRouter(tags=["transfer"])


@router.get("/export/csv")
def export_csv(
    db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)
) -> StreamingResponse:
    jobs = db.query(models.Job).filter(models.Job.user_id == current_user.id).all()
    stages = {s.id: s.name for s in db.query(models.PipelineStage).filter(models.PipelineStage.user_id == current_user.id)}
    sources = {s.id: s.name for s in db.query(models.JobSource).filter(models.JobSource.user_id == current_user.id)}

    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=EXPORT_COLUMNS)
    writer.writeheader()
    for job in jobs:
        writer.writerow(
            build_export_row(job, stages.get(job.stage_id), sources.get(job.source_id) if job.source_id else None)
        )

    buffer.seek(0)
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=jobflow_jobs.csv"},
    )


async def _read_csv_rows(file: UploadFile) -> tuple[list[str], list[dict]]:
    content = (await file.read()).decode("utf-8-sig")
    reader = csv.DictReader(io.StringIO(content))
    columns = reader.fieldnames or []
    rows = list(reader)
    return list(columns), rows


def _valid_stage_names(db: Session, user_id: str) -> dict[str, str]:
    stages = db.query(models.PipelineStage).filter(models.PipelineStage.user_id == user_id).all()
    return {s.name.lower(): s.name for s in stages}


def _existing_job_keys(db: Session, user_id: str) -> set[tuple[str, str]]:
    jobs = db.query(models.Job.title, models.Job.company).filter(models.Job.user_id == user_id).all()
    return {(title.strip().lower(), company.strip().lower()) for title, company in jobs}


@router.post("/import/csv/preview", response_model=schemas.CsvPreviewOut)
async def preview_csv(
    file: UploadFile = File(...),
    column_map: str | None = Form(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.CsvPreviewOut:
    columns, raw_rows = await _read_csv_rows(file)
    if column_map:
        try:
            mapping = json.loads(column_map)
        except json.JSONDecodeError as exc:
            raise validation_error("column_map must be valid JSON") from exc
    else:
        mapping = suggest_mapping(columns)

    valid_stage_names = _valid_stage_names(db, current_user.id)
    existing_jobs = _existing_job_keys(db, current_user.id)

    rows: list[schemas.CsvPreviewRow] = []
    for index, raw_row in enumerate(raw_rows):
        status, errors, warnings, parsed = parse_row(raw_row, mapping, existing_jobs, valid_stage_names)
        rows.append(
            schemas.CsvPreviewRow(row_index=index, status=status, errors=errors, warnings=warnings, parsed=parsed)
        )

    return schemas.CsvPreviewOut(columns=columns, suggested_mapping=suggest_mapping(columns), rows=rows)


@router.post("/import/csv/commit", response_model=schemas.CsvCommitOut)
async def commit_csv(
    file: UploadFile = File(...),
    column_map: str = Form(...),
    mode: str = Form("skip_duplicates"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
) -> schemas.CsvCommitOut:
    columns, raw_rows = await _read_csv_rows(file)
    try:
        mapping = json.loads(column_map)
    except json.JSONDecodeError as exc:
        raise validation_error("column_map must be valid JSON") from exc

    valid_stage_names = _valid_stage_names(db, current_user.id)
    existing_jobs = _existing_job_keys(db, current_user.id)
    stages_by_name = {
        s.name: s for s in db.query(models.PipelineStage).filter(models.PipelineStage.user_id == current_user.id)
    }
    interested_stage = get_interested_stage(db, current_user.id)

    imported = 0
    skipped = 0
    error_rows: list[schemas.CsvErrorRow] = []

    for index, raw_row in enumerate(raw_rows):
        status, errors, _warnings, parsed = parse_row(raw_row, mapping, existing_jobs, valid_stage_names)
        if status == "error":
            error_rows.append(schemas.CsvErrorRow(row_index=index, errors=errors))
            continue

        if mode == "skip_duplicates" and is_duplicate(parsed, existing_jobs):
            skipped += 1
            continue

        stage = stages_by_name.get(parsed["stage"]) if parsed.get("stage") else None
        if stage is None:
            stage = interested_stage

        now = utcnow()
        job = models.Job(
            user_id=current_user.id,
            stage_id=stage.id,
            title=parsed["title"],
            company=parsed["company"],
            location=parsed.get("location"),
            remote_status=parsed.get("remote_status"),
            employment_type=parsed.get("employment_type"),
            salary_min=parsed.get("salary_min"),
            salary_max=parsed.get("salary_max"),
            salary_currency=parsed.get("salary_currency"),
            salary_period=parsed.get("salary_period"),
            description=parsed.get("description"),
            reference_id=parsed.get("reference_id"),
            posting_url=parsed.get("posting_url"),
            company_website=parsed.get("company_website"),
            date_sourced=date.fromisoformat(parsed["date_sourced"]) if parsed.get("date_sourced") else None,
            date_applied=date.fromisoformat(parsed["date_applied"]) if parsed.get("date_applied") else None,
            deadline=date.fromisoformat(parsed["deadline"]) if parsed.get("deadline") else None,
            follow_up_date=date.fromisoformat(parsed["follow_up_date"]) if parsed.get("follow_up_date") else None,
            offer_date=date.fromisoformat(parsed["offer_date"]) if parsed.get("offer_date") else None,
            rejection_date=date.fromisoformat(parsed["rejection_date"]) if parsed.get("rejection_date") else None,
            entered_stage_at=now,
            last_activity_at=now,
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
        log_activity(db, current_user.id, job.id, "job_created", f"{job.title} at {job.company} imported from CSV")

        existing_jobs.add((job.title.strip().lower(), job.company.strip().lower()))
        imported += 1

    db.commit()
    return schemas.CsvCommitOut(imported=imported, skipped=skipped, error_rows=error_rows)
