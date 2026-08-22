import { api } from "@/api/client";
import type { JobCreateInput, JobDetail, JobPatchInput, Paginated, StageMoveInput } from "@/types";

export interface JobFilters {
  page?: number;
  page_size?: number;
  q?: string;
  stage_id?: string;
  company?: string;
  location?: string;
  remote_status?: string;
  min_salary?: number;
  applied_from?: string;
  applied_to?: string;
  sourced_from?: string;
  sourced_to?: string;
  has_interview?: boolean;
  overdue_tasks?: boolean;
  archived?: boolean;
  sort?: "last_activity" | "applied" | "created" | "company" | "salary";
  order?: "asc" | "desc";
}

function toQueryString(filters: JobFilters): string {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function listJobs(filters: JobFilters = {}): Promise<Paginated<JobDetail>> {
  return api.get<Paginated<JobDetail>>(`/jobs${toQueryString(filters)}`);
}

export function getJob(id: string): Promise<JobDetail> {
  return api.get<JobDetail>(`/jobs/${id}`);
}

export function createJob(input: JobCreateInput): Promise<JobDetail> {
  return api.post<JobDetail>("/jobs", input);
}

export function updateJob(id: string, input: JobPatchInput): Promise<JobDetail> {
  return api.patch<JobDetail>(`/jobs/${id}`, input);
}

export function deleteJob(id: string): Promise<void> {
  return api.delete<void>(`/jobs/${id}`);
}

export function archiveJob(id: string, archived: boolean): Promise<JobDetail> {
  return api.patch<JobDetail>(`/jobs/${id}/archive`, { archived });
}

export function moveJobStage(id: string, input: StageMoveInput): Promise<JobDetail> {
  return api.patch<JobDetail>(`/jobs/${id}/stage`, input);
}
