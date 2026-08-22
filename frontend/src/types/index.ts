export type StageType = "interested" | "applied" | "interview" | "offer" | "rejected" | "withdrawn" | "custom";
export type RemoteStatus = "remote" | "hybrid" | "onsite";
export type SalaryPeriod = "annual" | "monthly" | "weekly" | "daily" | "hourly";
export type TaskPriority = "low" | "medium" | "high";
export type InterviewStatus = "scheduled" | "completed" | "cancelled";
export type ActivityType =
  | "job_created"
  | "job_edited"
  | "stage_changed"
  | "interview_created"
  | "interview_completed"
  | "note_added"
  | "contact_added"
  | "contact_removed"
  | "task_created"
  | "task_completed"
  | "job_archived"
  | "job_restored"
  | "source_added";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_demo: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface Stage {
  id: string;
  name: string;
  position: number;
  color: string;
  stage_type: StageType;
  is_default: boolean;
  created_at: string;
  job_count: number;
}

export interface StageInput {
  name: string;
  color: string;
  stage_type?: StageType;
}

export interface StagePatchInput {
  name?: string;
  color?: string;
  stage_type?: StageType;
}

export interface Source {
  id: string;
  name: string;
}

export interface JobCard {
  id: string;
  stage_id: string;
  source_id: string | null;
  position: number;
  title: string;
  company: string;
  location: string | null;
  remote_status: RemoteStatus | null;
  employment_type: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_period: SalaryPeriod | null;
  date_sourced: string | null;
  date_applied: string | null;
  deadline: string | null;
  follow_up_date: string | null;
  archived: boolean;
  entered_stage_at: string;
  last_activity_at: string;
  created_at: string;
  next_interview_at: string | null;
  overdue_task_count: number;
  stage_name: string | null;
  stage_type: StageType | null;
  source_name: string | null;
}

export interface JobDetail extends JobCard {
  company_website: string | null;
  posting_url: string | null;
  description: string | null;
  reference_id: string | null;
  offer_date: string | null;
  rejection_date: string | null;
  updated_at: string;
}

export type Job = JobDetail;

export interface JobCreateInput {
  title: string;
  company: string;
  company_website?: string | null;
  posting_url?: string | null;
  location?: string | null;
  remote_status?: RemoteStatus | null;
  employment_type?: string | null;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string | null;
  salary_period?: SalaryPeriod | null;
  description?: string | null;
  reference_id?: string | null;
  source_id?: string | null;
  stage_id?: string | null;
  date_sourced?: string | null;
  date_applied?: string | null;
  deadline?: string | null;
  follow_up_date?: string | null;
  offer_date?: string | null;
  rejection_date?: string | null;
}

export type JobPatchInput = Partial<Omit<JobCreateInput, "stage_id">> & { archived?: boolean };

export interface StageMoveInput {
  stage_id: string;
  position?: number | null;
  before_id?: string | null;
  note?: string | null;
}

export interface Contact {
  id: string;
  job_id: string;
  name: string;
  job_title: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  notes: string | null;
}

export interface ContactInput {
  name: string;
  job_title?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  notes?: string | null;
}

export interface Interview {
  id: string;
  job_id: string;
  type_label: string;
  scheduled_at: string;
  duration_minutes: number | null;
  interviewers: string | null;
  meeting_url: string | null;
  location: string | null;
  notes: string | null;
  feedback: string | null;
  status: InterviewStatus;
  result: string | null;
  created_at: string;
}

export interface InterviewInput {
  type_label: string;
  scheduled_at: string;
  duration_minutes?: number | null;
  interviewers?: string | null;
  meeting_url?: string | null;
  location?: string | null;
  notes?: string | null;
}

export interface InterviewPatchInput {
  type_label?: string;
  scheduled_at?: string;
  duration_minutes?: number | null;
  interviewers?: string | null;
  meeting_url?: string | null;
  location?: string | null;
  notes?: string | null;
  feedback?: string | null;
  status?: InterviewStatus;
  result?: string | null;
}

export interface Task {
  id: string;
  job_id: string;
  title: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  priority: TaskPriority;
  notes: string | null;
  created_at: string;
}

export interface TaskInput {
  title: string;
  due_date?: string | null;
  priority?: TaskPriority;
  notes?: string | null;
}

export interface TaskPatchInput {
  title?: string;
  due_date?: string | null;
  completed?: boolean;
  priority?: TaskPriority;
  notes?: string | null;
}

export interface Note {
  id: string;
  job_id: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface NoteInput {
  body: string;
}

export interface Activity {
  id: string;
  job_id: string | null;
  type: ActivityType;
  message: string;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface DashboardStats {
  total_active: number;
  interested: number;
  applied: number;
  interviews: number;
  offers: number;
  rejected: number;
  withdrawn: number;
}

export interface DashboardMetrics {
  applications_this_week: number;
  applications_this_month: number;
  interviews_this_month: number;
  offers_received: number;
  app_to_interview_pct: number | null;
  interview_to_offer_pct: number | null;
  avg_days_apply_to_first_interview: number | null;
  avg_days_apply_to_offer: number | null;
}

export interface UpcomingInterview {
  id: string;
  job_id: string;
  job_title: string;
  company: string;
  scheduled_at: string;
  type_label: string;
}

export interface UpcomingTask {
  id: string;
  job_id: string;
  job_title: string;
  company: string;
  title: string;
  due_date: string | null;
}

export interface AttentionJob {
  id: string;
  title: string;
  company: string;
  stage_name: string;
  follow_up_date: string | null;
  last_activity_at: string;
}

export interface DashboardResponse {
  stats: DashboardStats;
  metrics: DashboardMetrics;
  upcoming: {
    interviews: UpcomingInterview[];
    overdue_tasks: UpcomingTask[];
    tasks_today: UpcomingTask[];
    attention: AttentionJob[];
  };
  recent_activity: Activity[];
}

export interface MonthCount {
  month: string;
  count: number;
}

export interface SourceStat {
  source: string;
  applications: number;
  interviews: number;
  offers: number;
  conversion_pct: number | null;
}

export interface StageJobCount {
  stage: string;
  jobs: number;
}

export interface StageAvgDays {
  stage_name: string;
  avg_days: number | null;
}

export interface AnalyticsResponse {
  applications_over_time: MonthCount[];
  by_source: SourceStat[];
  by_stage: StageJobCount[];
  interviews_per_month: MonthCount[];
  offers_per_month: MonthCount[];
  conversion_rates: {
    app_to_interview_pct: number | null;
    interview_to_offer_pct: number | null;
  };
  avg_days_per_stage: StageAvgDays[];
}

export type CalendarEventType = "interview" | "deadline" | "follow_up" | "task";

export interface CalendarEvent {
  date: string;
  type: CalendarEventType;
  label: string;
  time: string | null;
  job_id: string;
  job_title: string;
  job_company: string;
}

export interface InterviewTypes {
  defaults: string[];
  custom: string[];
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  job_id: string | null;
  due_at: string | null;
  read: boolean;
  channel: string;
  created_at: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface ImportPreviewRow {
  row_index: number;
  status: "ok" | "warning" | "error";
  errors: string[];
  warnings: string[];
  parsed: Record<string, unknown>;
}

export interface ImportPreview {
  columns: string[];
  suggested_mapping: Record<string, string>;
  rows: ImportPreviewRow[];
}

export interface ImportCommitResult {
  imported: number;
  skipped: number;
  error_rows: { row_index: number; errors: string[] }[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details: unknown;
  };
}
