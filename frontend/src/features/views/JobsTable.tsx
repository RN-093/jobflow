import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

import * as jobsApi from "@/api/jobs";
import type { JobFilters } from "@/api/jobs";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatDate } from "@/lib/dates";
import { formatSalaryRange } from "@/lib/money";

type SortKey = NonNullable<JobFilters["sort"]>;

interface JobsTableProps {
  filters: JobFilters;
  sort: SortKey;
  order: NonNullable<JobFilters["order"]>;
  onSortChange: (sort: SortKey) => void;
}

const COLUMNS: { key: SortKey | null; label: string }[] = [
  { key: "company", label: "Company" },
  { key: null, label: "Job" },
  { key: null, label: "Stage" },
  { key: null, label: "Sourced" },
  { key: "applied", label: "Applied" },
  { key: null, label: "Next action" },
  { key: null, label: "Interview" },
  { key: "salary", label: "Salary" },
  { key: "last_activity", label: "Last updated" },
];

export function JobsTable({ filters, sort, order, onSortChange }: JobsTableProps) {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["jobs", JSON.stringify({ ...filters, sort, order })],
    queryFn: () => jobsApi.listJobs({ ...filters, sort, order, page_size: 100 }),
  });

  if (isLoading) return <Skeleton className="h-96 w-full" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data || data.items.length === 0) return <EmptyState title="No jobs match these filters" />;

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="bg-surface-hover text-left text-xs uppercase text-muted">
          <tr>
            {COLUMNS.map((col) => (
              <th key={col.label} className="whitespace-nowrap px-3 py-2 font-medium">
                {col.key ? (
                  <button
                    onClick={() => onSortChange(col.key as SortKey)}
                    className="flex items-center gap-1 hover:text-text"
                    type="button"
                  >
                    {col.label}
                    {sort === col.key && (order === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />)}
                  </button>
                ) : (
                  col.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.items.map((job) => (
            <tr
              key={job.id}
              onClick={() => navigate(`/jobs/${job.id}`)}
              className="cursor-pointer bg-surface hover:bg-surface-hover"
            >
              <td className="whitespace-nowrap px-3 py-2 font-medium text-text">{job.company}</td>
              <td className="max-w-[220px] truncate px-3 py-2 text-text">{job.title}</td>
              <td className="whitespace-nowrap px-3 py-2">
                <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                  {job.stage_name}
                </span>
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-muted">{formatDate(job.date_sourced)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-muted">{formatDate(job.date_applied)}</td>
              <td className="whitespace-nowrap px-3 py-2 text-muted">
                {job.overdue_task_count > 0 ? `${job.overdue_task_count} overdue` : "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-muted">
                {job.next_interview_at ? formatDate(job.next_interview_at) : "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-muted">
                {formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency, job.salary_period) ?? "—"}
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-muted">{formatDate(job.last_activity_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
