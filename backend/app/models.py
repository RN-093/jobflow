from __future__ import annotations

from datetime import date, datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base
from app.utils import new_id, utcnow


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)


class JobSource(Base):
    __tablename__ = "job_sources"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_source_user_name"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)


class PipelineStage(Base):
    __tablename__ = "pipeline_stages"
    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_stage_user_name"),
        Index("ix_stage_user_position", "user_id", "position"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    color: Mapped[str] = mapped_column(String(7), nullable=False)
    stage_type: Mapped[str] = mapped_column(String(20), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)


class Job(Base):
    __tablename__ = "jobs"
    __table_args__ = (
        Index("ix_job_user_stage_position", "user_id", "stage_id", "position"),
        Index("ix_job_user_company", "user_id", "company"),
        Index("ix_job_user_date_applied", "user_id", "date_applied"),
        Index("ix_job_user_last_activity", "user_id", "last_activity_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    stage_id: Mapped[str] = mapped_column(String(36), ForeignKey("pipeline_stages.id"), nullable=False)
    source_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("job_sources.id", ondelete="SET NULL"), nullable=True
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    title: Mapped[str] = mapped_column(String(255), nullable=False)
    company: Mapped[str] = mapped_column(String(255), nullable=False)
    company_website: Mapped[str | None] = mapped_column(String(500), nullable=True)
    posting_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    remote_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    employment_type: Mapped[str | None] = mapped_column(String(40), nullable=True)
    salary_min: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_max: Mapped[int | None] = mapped_column(Integer, nullable=True)
    salary_currency: Mapped[str | None] = mapped_column(String(3), nullable=True)
    salary_period: Mapped[str | None] = mapped_column(String(20), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    reference_id: Mapped[str | None] = mapped_column(String(120), nullable=True)

    date_sourced: Mapped[date | None] = mapped_column(Date, nullable=True)
    date_applied: Mapped[date | None] = mapped_column(Date, nullable=True)
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    follow_up_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    offer_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    rejection_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    entered_stage_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    last_activity_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    archived: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    stage: Mapped[PipelineStage] = relationship()
    source: Mapped[JobSource | None] = relationship()
    contacts: Mapped[list[Contact]] = relationship(
        back_populates="job", cascade="all, delete-orphan", order_by="Contact.name"
    )
    interviews: Mapped[list[Interview]] = relationship(
        back_populates="job", cascade="all, delete-orphan", order_by="Interview.scheduled_at"
    )
    tasks: Mapped[list[Task]] = relationship(
        back_populates="job", cascade="all, delete-orphan", order_by="Task.due_date"
    )
    notes: Mapped[list[Note]] = relationship(
        back_populates="job", cascade="all, delete-orphan", order_by="Note.created_at.desc()"
    )
    history: Mapped[list[JobStageHistory]] = relationship(
        back_populates="job", cascade="all, delete-orphan", order_by="JobStageHistory.changed_at"
    )


class JobStageHistory(Base):
    __tablename__ = "job_stage_history"
    __table_args__ = (
        Index("ix_history_job_changed", "job_id", "changed_at"),
        Index("ix_history_user", "user_id"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    from_stage_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("pipeline_stages.id", ondelete="SET NULL"), nullable=True
    )
    to_stage_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("pipeline_stages.id", ondelete="SET NULL"), nullable=True
    )
    from_stage_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    to_stage_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    changed_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    job: Mapped[Job] = relationship(back_populates="history")


class Contact(Base):
    __tablename__ = "contacts"
    __table_args__ = (Index("ix_contact_job", "job_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    job_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    linkedin_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    job: Mapped[Job] = relationship(back_populates="contacts")


class Interview(Base):
    __tablename__ = "interviews"
    __table_args__ = (
        Index("ix_interview_user_scheduled", "user_id", "scheduled_at"),
        Index("ix_interview_job_scheduled", "job_id", "scheduled_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    type_label: Mapped[str] = mapped_column(String(120), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    duration_minutes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    interviewers: Mapped[str | None] = mapped_column(String(500), nullable=True)
    meeting_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="scheduled")
    result: Mapped[str | None] = mapped_column(String(120), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    job: Mapped[Job] = relationship(back_populates="interviews")


class Task(Base):
    __tablename__ = "tasks"
    __table_args__ = (Index("ix_task_user_completed_due", "user_id", "completed", "due_date"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    priority: Mapped[str] = mapped_column(String(10), nullable=False, default="medium")
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)

    job: Mapped[Job] = relationship(back_populates="tasks")


class Note(Base):
    __tablename__ = "notes"
    __table_args__ = (Index("ix_note_job", "job_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    job_id: Mapped[str] = mapped_column(String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, onupdate=utcnow, nullable=False)

    job: Mapped[Job] = relationship(back_populates="notes")


class Activity(Base):
    __tablename__ = "activities"
    __table_args__ = (
        Index("ix_activity_job", "job_id"),
        Index("ix_activity_user_created", "user_id", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    job_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True
    )
    type: Mapped[str] = mapped_column(String(40), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)


class Notification(Base):
    __tablename__ = "notifications"
    __table_args__ = (
        UniqueConstraint("user_id", "key", name="uq_notification_user_key"),
        Index("ix_notification_user_read_created", "user_id", "read", "created_at"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=new_id)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    key: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(40), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    job_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True
    )
    due_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    channel: Mapped[str] = mapped_column(String(20), default="in_app", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=utcnow, nullable=False)
