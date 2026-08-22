from __future__ import annotations

from datetime import date, datetime

EXPORT_COLUMNS = [
    "title",
    "company",
    "location",
    "remote_status",
    "employment_type",
    "salary_min",
    "salary_max",
    "salary_currency",
    "salary_period",
    "source",
    "reference_id",
    "posting_url",
    "company_website",
    "job_description",
    "stage",
    "date_sourced",
    "date_applied",
    "deadline",
    "follow_up_date",
    "offer_date",
    "rejection_date",
]

IMPORT_FIELDS = [
    "title",
    "company",
    "location",
    "remote_status",
    "employment_type",
    "salary_min",
    "salary_max",
    "salary_currency",
    "salary_period",
    "source",
    "reference_id",
    "posting_url",
    "company_website",
    "description",
    "stage",
    "date_sourced",
    "date_applied",
    "deadline",
    "follow_up_date",
    "offer_date",
    "rejection_date",
]

DATE_FIELDS = {"date_sourced", "date_applied", "deadline", "follow_up_date", "offer_date", "rejection_date"}
INT_FIELDS = {"salary_min", "salary_max"}
REQUIRED_FIELDS = {"title", "company"}


def parse_flexible_date(value: str) -> date:
    value = value.strip()
    for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d/%m/%Y"):
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    raise ValueError(f"Unrecognized date format: {value}")


def build_export_row(job, stage_name: str | None, source_name: str | None) -> dict:
    def d(value: date | None) -> str:
        return value.isoformat() if value else ""

    return {
        "title": job.title,
        "company": job.company,
        "location": job.location or "",
        "remote_status": job.remote_status or "",
        "employment_type": job.employment_type or "",
        "salary_min": job.salary_min if job.salary_min is not None else "",
        "salary_max": job.salary_max if job.salary_max is not None else "",
        "salary_currency": job.salary_currency or "",
        "salary_period": job.salary_period or "",
        "source": source_name or "",
        "reference_id": job.reference_id or "",
        "posting_url": job.posting_url or "",
        "company_website": job.company_website or "",
        "job_description": job.description or "",
        "stage": stage_name or "",
        "date_sourced": d(job.date_sourced),
        "date_applied": d(job.date_applied),
        "deadline": d(job.deadline),
        "follow_up_date": d(job.follow_up_date),
        "offer_date": d(job.offer_date),
        "rejection_date": d(job.rejection_date),
    }


def suggest_mapping(columns: list[str]) -> dict[str, str]:
    normalized = {c.strip().lower().replace(" ", "_"): c for c in columns}
    aliases: dict[str, list[str]] = {field: [field] for field in IMPORT_FIELDS}
    aliases["description"] = ["description", "job_description"]

    mapping: dict[str, str] = {}
    for field, candidates in aliases.items():
        for candidate in candidates:
            if candidate in normalized:
                mapping[field] = normalized[candidate]
                break
    return mapping


def parse_row(
    raw_row: dict[str, str],
    column_map: dict[str, str],
    existing_jobs: set[tuple[str, str]],
    valid_stage_names: dict[str, str],
) -> tuple[str, list[str], list[str], dict]:
    errors: list[str] = []
    warnings: list[str] = []
    parsed: dict = {}

    def get(field: str) -> str:
        col = column_map.get(field)
        if not col:
            return ""
        return (raw_row.get(col) or "").strip()

    for field in REQUIRED_FIELDS:
        value = get(field)
        if not value:
            errors.append(f"Missing required field: {field}")
        parsed[field] = value or None

    for field in [
        "location",
        "remote_status",
        "employment_type",
        "salary_currency",
        "salary_period",
        "source",
        "reference_id",
        "posting_url",
        "company_website",
        "description",
    ]:
        parsed[field] = get(field) or None

    for field in INT_FIELDS:
        raw_value = get(field)
        if raw_value:
            try:
                parsed[field] = int(raw_value)
            except ValueError:
                errors.append(f"Invalid integer for {field}: '{raw_value}'")
                parsed[field] = None
        else:
            parsed[field] = None

    for field in DATE_FIELDS:
        raw_value = get(field)
        if raw_value:
            try:
                parsed[field] = parse_flexible_date(raw_value).isoformat()
            except ValueError:
                errors.append(f"Invalid date for {field}: '{raw_value}'")
                parsed[field] = None
        else:
            parsed[field] = None

    stage_raw = get("stage")
    if stage_raw:
        canonical = valid_stage_names.get(stage_raw.lower())
        if canonical:
            parsed["stage"] = canonical
        else:
            warnings.append(f"Unknown stage '{stage_raw}' — will default to Interested")
            parsed["stage"] = None
    else:
        parsed["stage"] = None

    if parsed.get("title") and parsed.get("company"):
        key = (parsed["title"].strip().lower(), parsed["company"].strip().lower())
        if key in existing_jobs:
            warnings.append("Possible duplicate of an existing job (same title & company)")

    status = "error" if errors else ("warning" if warnings else "ok")
    return status, errors, warnings, parsed


def is_duplicate(parsed: dict, existing_jobs: set[tuple[str, str]]) -> bool:
    if not (parsed.get("title") and parsed.get("company")):
        return False
    key = (parsed["title"].strip().lower(), parsed["company"].strip().lower())
    return key in existing_jobs
