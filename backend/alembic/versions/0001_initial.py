"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-08-22

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=True),
        sa.Column("is_demo", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.UniqueConstraint("email", name="uq_user_email"),
    )
    op.create_index("ix_users_email", "users", ["email"])

    op.create_table(
        "job_sources",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.UniqueConstraint("user_id", "name", name="uq_source_user_name"),
    )

    op.create_table(
        "pipeline_stages",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("position", sa.Integer, nullable=False, server_default="0"),
        sa.Column("color", sa.String(7), nullable=False),
        sa.Column("stage_type", sa.String(20), nullable=False),
        sa.Column("is_default", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.UniqueConstraint("user_id", "name", name="uq_stage_user_name"),
    )
    op.create_index("ix_stage_user_position", "pipeline_stages", ["user_id", "position"])

    op.create_table(
        "jobs",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("stage_id", sa.String(36), sa.ForeignKey("pipeline_stages.id"), nullable=False),
        sa.Column("source_id", sa.String(36), sa.ForeignKey("job_sources.id", ondelete="SET NULL"), nullable=True),
        sa.Column("position", sa.Integer, nullable=False, server_default="0"),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("company", sa.String(255), nullable=False),
        sa.Column("company_website", sa.String(500), nullable=True),
        sa.Column("posting_url", sa.String(500), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("remote_status", sa.String(20), nullable=True),
        sa.Column("employment_type", sa.String(40), nullable=True),
        sa.Column("salary_min", sa.Integer, nullable=True),
        sa.Column("salary_max", sa.Integer, nullable=True),
        sa.Column("salary_currency", sa.String(3), nullable=True),
        sa.Column("salary_period", sa.String(20), nullable=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("reference_id", sa.String(120), nullable=True),
        sa.Column("date_sourced", sa.Date, nullable=True),
        sa.Column("date_applied", sa.Date, nullable=True),
        sa.Column("deadline", sa.Date, nullable=True),
        sa.Column("follow_up_date", sa.Date, nullable=True),
        sa.Column("offer_date", sa.Date, nullable=True),
        sa.Column("rejection_date", sa.Date, nullable=True),
        sa.Column("entered_stage_at", sa.DateTime, nullable=False),
        sa.Column("last_activity_at", sa.DateTime, nullable=False),
        sa.Column("archived", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_job_user_stage_position", "jobs", ["user_id", "stage_id", "position"])
    op.create_index("ix_job_user_company", "jobs", ["user_id", "company"])
    op.create_index("ix_job_user_date_applied", "jobs", ["user_id", "date_applied"])
    op.create_index("ix_job_user_last_activity", "jobs", ["user_id", "last_activity_at"])

    op.create_table(
        "job_stage_history",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", sa.String(36), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("from_stage_id", sa.String(36), sa.ForeignKey("pipeline_stages.id", ondelete="SET NULL"), nullable=True),
        sa.Column("to_stage_id", sa.String(36), sa.ForeignKey("pipeline_stages.id", ondelete="SET NULL"), nullable=True),
        sa.Column("from_stage_name", sa.String(120), nullable=True),
        sa.Column("to_stage_name", sa.String(120), nullable=True),
        sa.Column("changed_at", sa.DateTime, nullable=False),
        sa.Column("note", sa.Text, nullable=True),
    )
    op.create_index("ix_history_job_changed", "job_stage_history", ["job_id", "changed_at"])
    op.create_index("ix_history_user", "job_stage_history", ["user_id"])

    op.create_table(
        "contacts",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("job_id", sa.String(36), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("job_title", sa.String(255), nullable=True),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("phone", sa.String(50), nullable=True),
        sa.Column("linkedin_url", sa.String(500), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
    )
    op.create_index("ix_contact_job", "contacts", ["job_id"])

    op.create_table(
        "interviews",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", sa.String(36), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type_label", sa.String(120), nullable=False),
        sa.Column("scheduled_at", sa.DateTime, nullable=False),
        sa.Column("duration_minutes", sa.Integer, nullable=True),
        sa.Column("interviewers", sa.String(500), nullable=True),
        sa.Column("meeting_url", sa.String(500), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("feedback", sa.Text, nullable=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="scheduled"),
        sa.Column("result", sa.String(120), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_interview_user_scheduled", "interviews", ["user_id", "scheduled_at"])
    op.create_index("ix_interview_job_scheduled", "interviews", ["job_id", "scheduled_at"])

    op.create_table(
        "tasks",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", sa.String(36), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("due_date", sa.Date, nullable=True),
        sa.Column("completed", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("completed_at", sa.DateTime, nullable=True),
        sa.Column("priority", sa.String(10), nullable=False, server_default="medium"),
        sa.Column("notes", sa.Text, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_task_user_completed_due", "tasks", ["user_id", "completed", "due_date"])

    op.create_table(
        "notes",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("job_id", sa.String(36), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.Column("updated_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_note_job", "notes", ["job_id"])

    op.create_table(
        "activities",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_id", sa.String(36), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True),
        sa.Column("type", sa.String(40), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("meta", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False),
    )
    op.create_index("ix_activity_job", "activities", ["job_id"])
    op.create_index("ix_activity_user_created", "activities", ["user_id", "created_at"])

    op.create_table(
        "notifications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("key", sa.String(255), nullable=False),
        sa.Column("type", sa.String(40), nullable=False),
        sa.Column("message", sa.Text, nullable=False),
        sa.Column("job_id", sa.String(36), sa.ForeignKey("jobs.id", ondelete="CASCADE"), nullable=True),
        sa.Column("due_at", sa.DateTime, nullable=True),
        sa.Column("read", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("channel", sa.String(20), nullable=False, server_default="in_app"),
        sa.Column("created_at", sa.DateTime, nullable=False),
        sa.UniqueConstraint("user_id", "key", name="uq_notification_user_key"),
    )
    op.create_index("ix_notification_user_read_created", "notifications", ["user_id", "read", "created_at"])


def downgrade() -> None:
    op.drop_table("notifications")
    op.drop_table("activities")
    op.drop_table("notes")
    op.drop_table("tasks")
    op.drop_table("interviews")
    op.drop_table("contacts")
    op.drop_table("job_stage_history")
    op.drop_table("jobs")
    op.drop_table("pipeline_stages")
    op.drop_table("job_sources")
    op.drop_table("users")
