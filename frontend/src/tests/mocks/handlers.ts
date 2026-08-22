import { http, HttpResponse } from "msw";

import type { Interview, Job, JobDetail, Paginated, Stage, Task } from "@/types";

export const STAGES: Stage[] = [
  {
    id: "stage-interested",
    name: "Interested",
    position: 0,
    color: "#6366f1",
    stage_type: "interested",
    is_default: true,
    created_at: "2026-01-01T00:00:00",
    job_count: 0,
  },
  {
    id: "stage-applied",
    name: "Applied",
    position: 1,
    color: "#3b82f6",
    stage_type: "applied",
    is_default: true,
    created_at: "2026-01-01T00:00:00",
    job_count: 0,
  },
  {
    id: "stage-interview1",
    name: "Interview 1",
    position: 2,
    color: "#06b6d4",
    stage_type: "interview",
    is_default: true,
    created_at: "2026-01-01T00:00:00",
    job_count: 0,
  },
];

function makeJob(overrides: Partial<JobDetail> = {}): JobDetail {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? `job-${Math.random().toString(36).slice(2)}`,
    stage_id: "stage-interested",
    source_id: null,
    position: 0,
    title: "Software Engineer",
    company: "Acme",
    location: null,
    remote_status: null,
    employment_type: null,
    salary_min: null,
    salary_max: null,
    salary_currency: null,
    salary_period: null,
    date_sourced: null,
    date_applied: null,
    deadline: null,
    follow_up_date: null,
    archived: false,
    entered_stage_at: now,
    last_activity_at: now,
    created_at: now,
    next_interview_at: null,
    overdue_task_count: 0,
    stage_name: "Interested",
    stage_type: "interested",
    source_name: null,
    company_website: null,
    posting_url: null,
    description: null,
    reference_id: null,
    offer_date: null,
    rejection_date: null,
    updated_at: now,
    ...overrides,
  };
}

export let jobsStore: JobDetail[] = [];
export let interviewsStore: Record<string, Interview[]> = {};
export let tasksStore: Record<string, Task[]> = {};

export function resetMockData(): void {
  jobsStore = [
    makeJob({
      id: "job-1",
      title: "Backend Engineer",
      company: "Globex",
      remote_status: "remote",
      salary_min: 90000,
      salary_max: 110000,
    }),
    makeJob({
      id: "job-2",
      title: "Frontend Engineer",
      company: "Initech",
      remote_status: "onsite",
      salary_min: 60000,
      salary_max: 70000,
    }),
  ];
  interviewsStore = { "job-1": [], "job-2": [] };
  tasksStore = { "job-1": [], "job-2": [] };
}
resetMockData();

function stageNameFor(id: string): string {
  return STAGES.find((s) => s.id === id)?.name ?? "Unknown";
}
function stageTypeFor(id: string): Stage["stage_type"] {
  return STAGES.find((s) => s.id === id)?.stage_type ?? "custom";
}

export const handlers = [
  http.post("/api/auth/login", async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    if (body.password === "wrongpassword") {
      return HttpResponse.json(
        { error: { code: "unauthorized", message: "Incorrect email or password", details: null } },
        { status: 401 }
      );
    }
    return HttpResponse.json({
      access_token: "mock-token",
      token_type: "bearer",
      user: {
        id: "user-1",
        email: body.email,
        full_name: "Test User",
        is_demo: false,
        created_at: new Date().toISOString(),
      },
    });
  }),

  http.post("/api/auth/register", async ({ request }) => {
    const body = (await request.json()) as { email: string; full_name?: string };
    return HttpResponse.json(
      {
        access_token: "mock-token",
        token_type: "bearer",
        user: {
          id: "user-1",
          email: body.email,
          full_name: body.full_name ?? null,
          is_demo: false,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  }),

  http.get("/api/auth/me", () => {
    return HttpResponse.json({
      id: "user-1",
      email: "user@example.com",
      full_name: "Test User",
      is_demo: false,
      created_at: new Date().toISOString(),
    });
  }),

  http.get("/api/pipeline/stages", () => {
    return HttpResponse.json(
      STAGES.map((s) => ({ ...s, job_count: jobsStore.filter((j) => j.stage_id === s.id).length }))
    );
  }),

  http.get("/api/sources", () => HttpResponse.json([])),
  http.get("/api/interview-types", () => HttpResponse.json({ defaults: ["Recruiter Screen"], custom: [] })),
  http.get("/api/notifications", () => HttpResponse.json([])),

  http.get("/api/jobs", ({ request }) => {
    const url = new URL(request.url);
    let items = [...jobsStore];

    const q = url.searchParams.get("q");
    if (q) {
      const lower = q.toLowerCase();
      items = items.filter((j) => j.title.toLowerCase().includes(lower) || j.company.toLowerCase().includes(lower));
    }
    const remoteStatus = url.searchParams.get("remote_status");
    if (remoteStatus) items = items.filter((j) => j.remote_status === remoteStatus);
    const minSalary = url.searchParams.get("min_salary");
    if (minSalary) items = items.filter((j) => (j.salary_max ?? 0) >= Number(minSalary));

    const pageSize = Number(url.searchParams.get("page_size") ?? 20);
    const response: Paginated<JobDetail> = {
      items: items.slice(0, pageSize),
      total: items.length,
      page: 1,
      page_size: pageSize,
    };
    return HttpResponse.json(response);
  }),

  http.post("/api/jobs", async ({ request }) => {
    const body = (await request.json()) as Partial<Job>;
    const job = makeJob({
      id: `job-${jobsStore.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
      title: body.title ?? "New role",
      company: body.company ?? "Unknown",
      stage_id: "stage-interested",
      stage_name: "Interested",
      stage_type: "interested",
    });
    jobsStore.push(job);
    return HttpResponse.json(job, { status: 201 });
  }),

  http.get("/api/jobs/:id", ({ params }) => {
    const job = jobsStore.find((j) => j.id === params.id);
    if (!job) {
      return HttpResponse.json({ error: { code: "not_found", message: "Not found", details: null } }, { status: 404 });
    }
    return HttpResponse.json(job);
  }),

  http.patch("/api/jobs/:id/stage", async ({ params, request }) => {
    const body = (await request.json()) as { stage_id: string; position?: number };
    const job = jobsStore.find((j) => j.id === params.id);
    if (!job) {
      return HttpResponse.json({ error: { code: "not_found", message: "Not found", details: null } }, { status: 404 });
    }
    job.stage_id = body.stage_id;
    job.stage_name = stageNameFor(body.stage_id);
    job.stage_type = stageTypeFor(body.stage_id);
    if (body.position !== undefined) job.position = body.position;
    return HttpResponse.json(job);
  }),

  http.get("/api/jobs/:id/interviews", ({ params }) => {
    return HttpResponse.json(interviewsStore[params.id as string] ?? []);
  }),
  http.post("/api/jobs/:id/interviews", async ({ params, request }) => {
    const body = (await request.json()) as { type_label: string; scheduled_at: string; interviewers?: string };
    const jobId = params.id as string;
    const interview: Interview = {
      id: `iv-${Math.random().toString(36).slice(2)}`,
      job_id: jobId,
      type_label: body.type_label,
      scheduled_at: body.scheduled_at,
      duration_minutes: null,
      interviewers: body.interviewers ?? null,
      meeting_url: null,
      location: null,
      notes: null,
      feedback: null,
      status: "scheduled",
      result: null,
      created_at: new Date().toISOString(),
    };
    interviewsStore[jobId] = [...(interviewsStore[jobId] ?? []), interview];
    return HttpResponse.json(interview, { status: 201 });
  }),

  http.get("/api/jobs/:id/contacts", () => HttpResponse.json([])),
  http.get("/api/jobs/:id/notes", () => HttpResponse.json([])),
  http.get("/api/jobs/:id/timeline", () => HttpResponse.json([])),

  http.get("/api/jobs/:id/tasks", ({ params }) => {
    return HttpResponse.json(tasksStore[params.id as string] ?? []);
  }),
  http.post("/api/jobs/:id/tasks", async ({ params, request }) => {
    const body = (await request.json()) as { title: string; due_date?: string };
    const jobId = params.id as string;
    const task: Task = {
      id: `task-${Math.random().toString(36).slice(2)}`,
      job_id: jobId,
      title: body.title,
      due_date: body.due_date ?? null,
      completed: false,
      completed_at: null,
      priority: "medium",
      notes: null,
      created_at: new Date().toISOString(),
    };
    tasksStore[jobId] = [...(tasksStore[jobId] ?? []), task];
    return HttpResponse.json(task, { status: 201 });
  }),
  http.patch("/api/jobs/:id/tasks/:taskId", async ({ params, request }) => {
    const body = (await request.json()) as { completed?: boolean };
    const jobId = params.id as string;
    const list = tasksStore[jobId] ?? [];
    const task = list.find((t) => t.id === params.taskId);
    if (!task) {
      return HttpResponse.json({ error: { code: "not_found", message: "Not found", details: null } }, { status: 404 });
    }
    if (body.completed !== undefined) {
      task.completed = body.completed;
      task.completed_at = body.completed ? new Date().toISOString() : null;
    }
    return HttpResponse.json(task);
  }),
];
