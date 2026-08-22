import type { RemoteStatus, SalaryPeriod, StageType, TaskPriority } from "@/types";

export const STAGE_TYPE_LABELS: Record<StageType, string> = {
  interested: "Interested",
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
  custom: "Custom",
};

export const REMOTE_STATUS_OPTIONS: { value: RemoteStatus; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
];

export const SALARY_PERIOD_OPTIONS: { value: SalaryPeriod; label: string }[] = [
  { value: "annual", label: "Annual" },
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "daily", label: "Daily" },
  { value: "hourly", label: "Hourly" },
];

export const TASK_PRIORITY_OPTIONS: { value: TaskPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const EMPLOYMENT_TYPE_OPTIONS = [
  { value: "full_time", label: "Full-time" },
  { value: "part_time", label: "Part-time" },
  { value: "contract", label: "Contract" },
  { value: "internship", label: "Internship" },
];

export const STAGE_COLORS = [
  "#6366f1",
  "#3b82f6",
  "#06b6d4",
  "#8b5cf6",
  "#a855f7",
  "#0ea5e9",
  "#f59e0b",
  "#d946ef",
  "#10b981",
  "#ef4444",
  "#64748b",
];
