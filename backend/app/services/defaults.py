from sqlalchemy.orm import Session

from app import models

DEFAULT_STAGES: list[tuple[str, str, str]] = [
    ("Interested", "interested", "#6366f1"),
    ("Applied", "applied", "#3b82f6"),
    ("Interview 1", "interview", "#06b6d4"),
    ("Interview 2", "interview", "#8b5cf6"),
    ("Interview 3", "interview", "#a855f7"),
    ("Video Interview", "interview", "#0ea5e9"),
    ("HV Test", "interview", "#f59e0b"),
    ("CEO Interview", "interview", "#d946ef"),
    ("Offer", "offer", "#10b981"),
    ("Rejected", "rejected", "#ef4444"),
    ("Withdrawn", "withdrawn", "#64748b"),
]

DEFAULT_SOURCES: list[str] = [
    "LinkedIn",
    "Indeed",
    "Otta",
    "Company website",
    "Recruiter",
    "Referral",
    "Networking",
    "Other",
]

DEFAULT_INTERVIEW_TYPES: list[str] = [
    "Recruiter Screen",
    "Interview 1",
    "Interview 2",
    "Interview 3",
    "Video Interview",
    "Technical Interview",
    "HV Test",
    "Hiring Manager",
    "CEO Interview",
    "Final Interview",
    "Other",
]


def seed_defaults_for_user(db: Session, user: models.User) -> None:
    for position, (name, stage_type, color) in enumerate(DEFAULT_STAGES):
        db.add(
            models.PipelineStage(
                user_id=user.id,
                name=name,
                stage_type=stage_type,
                color=color,
                position=position,
                is_default=True,
            )
        )
    for name in DEFAULT_SOURCES:
        db.add(models.JobSource(user_id=user.id, name=name))
    db.flush()


def get_interested_stage(db: Session, user_id: str) -> models.PipelineStage | None:
    return (
        db.query(models.PipelineStage)
        .filter(models.PipelineStage.user_id == user_id, models.PipelineStage.name == "Interested")
        .first()
    )
