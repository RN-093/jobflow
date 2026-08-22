from __future__ import annotations

from datetime import date, datetime
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, EmailStr, Field

T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    page_size: int


# ---------- Auth ----------


class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str | None = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: str
    full_name: str | None
    is_demo: bool
    created_at: datetime


class AuthOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Pipeline ----------


class StageIn(BaseModel):
    name: str
    color: str
    stage_type: str = "custom"


class StagePatch(BaseModel):
    name: str | None = None
    color: str | None = None
    stage_type: str | None = None


class StageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    position: int
    color: str
    stage_type: str
    is_default: bool
    created_at: datetime
    job_count: int = 0


class ReorderIn(BaseModel):
    ordered_ids: list[str]


# ---------- Sources ----------


class SourceIn(BaseModel):
    name: str


class SourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str


# ---------- Jobs ----------


class JobBase(BaseModel):
    title: str
    company: str
    company_website: str | None = None
    posting_url: str | None = None
    location: str | None = None
    remote_status: str | None = None
    employment_type: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str | None = None
    salary_period: str | None = None
    description: str | None = None
    reference_id: str | None = None
    source_id: str | None = None
    date_sourced: date | None = None
    date_applied: date | None = None
    deadline: date | None = None
    follow_up_date: date | None = None
    offer_date: date | None = None
    rejection_date: date | None = None


class JobCreate(JobBase):
    stage_id: str | None = None


class JobPatch(BaseModel):
    title: str | None = None
    company: str | None = None
    company_website: str | None = None
    posting_url: str | None = None
    location: str | None = None
    remote_status: str | None = None
    employment_type: str | None = None
    salary_min: int | None = None
    salary_max: int | None = None
    salary_currency: str | None = None
    salary_period: str | None = None
    description: str | None = None
    reference_id: str | None = None
    source_id: str | None = None
    date_sourced: date | None = None
    date_applied: date | None = None
    deadline: date | None = None
    follow_up_date: date | None = None
    offer_date: date | None = None
    rejection_date: date | None = None
    archived: bool | None = None


class ArchiveIn(BaseModel):
    archived: bool


class StageMoveIn(BaseModel):
    stage_id: str
    position: int | None = None
    before_id: str | None = None
    note: str | None = None


class JobCard(BaseModel):
    id: str
    stage_id: str
    source_id: str | None
    position: int
    title: str
    company: str
    location: str | None
    remote_status: str | None
    employment_type: str | None
    salary_min: int | None
    salary_max: int | None
    salary_currency: str | None
    salary_period: str | None
    date_sourced: date | None
    date_applied: date | None
    deadline: date | None
    follow_up_date: date | None
    archived: bool
    entered_stage_at: datetime
    last_activity_at: datetime
    created_at: datetime
    next_interview_at: datetime | None = None
    overdue_task_count: int = 0
    stage_name: str | None = None
    stage_type: str | None = None
    source_name: str | None = None


class JobDetail(JobCard):
    company_website: str | None
    posting_url: str | None
    description: str | None
    reference_id: str | None
    offer_date: date | None
    rejection_date: date | None
    updated_at: datetime


# ---------- Job children ----------


class ContactCreate(BaseModel):
    name: str
    job_title: str | None = None
    email: str | None = None
    phone: str | None = None
    linkedin_url: str | None = None
    notes: str | None = None


class ContactPatch(BaseModel):
    name: str | None = None
    job_title: str | None = None
    email: str | None = None
    phone: str | None = None
    linkedin_url: str | None = None
    notes: str | None = None


class ContactOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    job_id: str
    name: str
    job_title: str | None
    email: str | None
    phone: str | None
    linkedin_url: str | None
    notes: str | None


class InterviewCreate(BaseModel):
    type_label: str
    scheduled_at: datetime
    duration_minutes: int | None = None
    interviewers: str | None = None
    meeting_url: str | None = None
    location: str | None = None
    notes: str | None = None


class InterviewPatch(BaseModel):
    type_label: str | None = None
    scheduled_at: datetime | None = None
    duration_minutes: int | None = None
    interviewers: str | None = None
    meeting_url: str | None = None
    location: str | None = None
    notes: str | None = None
    feedback: str | None = None
    status: str | None = None
    result: str | None = None


class InterviewOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    job_id: str
    type_label: str
    scheduled_at: datetime
    duration_minutes: int | None
    interviewers: str | None
    meeting_url: str | None
    location: str | None
    notes: str | None
    feedback: str | None
    status: str
    result: str | None
    created_at: datetime


class TaskCreate(BaseModel):
    title: str
    due_date: date | None = None
    priority: str = "medium"
    notes: str | None = None


class TaskPatch(BaseModel):
    title: str | None = None
    due_date: date | None = None
    completed: bool | None = None
    priority: str | None = None
    notes: str | None = None


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    job_id: str
    title: str
    due_date: date | None
    completed: bool
    completed_at: datetime | None
    priority: str
    notes: str | None
    created_at: datetime


class NoteCreate(BaseModel):
    body: str


class NotePatch(BaseModel):
    body: str | None = None


class NoteOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    job_id: str
    body: str
    created_at: datetime
    updated_at: datetime


class ActivityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    job_id: str | None
    type: str
    message: str
    meta: dict | None
    created_at: datetime


# ---------- Dashboard ----------


class DashboardStats(BaseModel):
    total_active: int
    interested: int
    applied: int
    interviews: int
    offers: int
    rejected: int
    withdrawn: int


class DashboardMetrics(BaseModel):
    applications_this_week: int
    applications_this_month: int
    interviews_this_month: int
    offers_received: int
    app_to_interview_pct: float | None
    interview_to_offer_pct: float | None
    avg_days_apply_to_first_interview: float | None
    avg_days_apply_to_offer: float | None


class UpcomingInterview(BaseModel):
    id: str
    job_id: str
    job_title: str
    company: str
    scheduled_at: datetime
    type_label: str


class UpcomingTask(BaseModel):
    id: str
    job_id: str
    job_title: str
    company: str
    title: str
    due_date: date | None


class AttentionJob(BaseModel):
    id: str
    title: str
    company: str
    stage_name: str
    follow_up_date: date | None
    last_activity_at: datetime


class DashboardUpcoming(BaseModel):
    interviews: list[UpcomingInterview]
    overdue_tasks: list[UpcomingTask]
    tasks_today: list[UpcomingTask]
    attention: list[AttentionJob]


class DashboardOut(BaseModel):
    stats: DashboardStats
    metrics: DashboardMetrics
    upcoming: DashboardUpcoming
    recent_activity: list[ActivityOut]


# ---------- Analytics ----------


class MonthCount(BaseModel):
    month: str
    count: int


class SourceStat(BaseModel):
    source: str
    applications: int
    interviews: int
    offers: int
    conversion_pct: float | None


class StageJobCount(BaseModel):
    stage: str
    jobs: int


class ConversionRates(BaseModel):
    app_to_interview_pct: float | None
    interview_to_offer_pct: float | None


class StageAvgDays(BaseModel):
    stage_name: str
    avg_days: float | None


class AnalyticsOut(BaseModel):
    applications_over_time: list[MonthCount]
    by_source: list[SourceStat]
    by_stage: list[StageJobCount]
    interviews_per_month: list[MonthCount]
    offers_per_month: list[MonthCount]
    conversion_rates: ConversionRates
    avg_days_per_stage: list[StageAvgDays]


# ---------- Calendar ----------


class CalendarEvent(BaseModel):
    date: date
    type: str
    label: str
    time: datetime | None
    job_id: str
    job_title: str
    job_company: str


# ---------- Interview types ----------


class InterviewTypesOut(BaseModel):
    defaults: list[str]
    custom: list[str]


# ---------- Notifications ----------


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    type: str
    message: str
    job_id: str | None
    due_at: datetime | None
    read: bool
    channel: str
    created_at: datetime


class NotificationPatch(BaseModel):
    read: bool


# ---------- CSV transfer ----------


class CsvPreviewRow(BaseModel):
    row_index: int
    status: str
    errors: list[str]
    warnings: list[str]
    parsed: dict


class CsvPreviewOut(BaseModel):
    columns: list[str]
    suggested_mapping: dict[str, str]
    rows: list[CsvPreviewRow]


class CsvErrorRow(BaseModel):
    row_index: int
    errors: list[str]


class CsvCommitOut(BaseModel):
    imported: int
    skipped: int
    error_rows: list[CsvErrorRow]
