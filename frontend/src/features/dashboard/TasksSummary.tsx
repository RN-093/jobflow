import { Link } from "react-router-dom";

import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/dates";
import type { AttentionJob, DashboardResponse, UpcomingTask } from "@/types";

interface TasksSummaryProps {
  upcoming: DashboardResponse["upcoming"];
}

export function TasksSummary({ upcoming }: TasksSummaryProps) {
  const { overdue_tasks: overdue, tasks_today: today, attention } = upcoming;
  const allClear = overdue.length === 0 && today.length === 0;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Tasks</p>
      <Card>
        {allClear ? (
          <p className="text-sm text-muted">Nothing due today. Everything's up to date.</p>
        ) : (
          <div className="space-y-1">
            {overdue.map((t) => (
              <TaskRow key={t.id} task={t} overdue />
            ))}
            {today.map((t) => (
              <TaskRow key={t.id} task={t} />
            ))}
          </div>
        )}

        {attention.length > 0 && (
          <div className={allClear ? undefined : "mt-4 border-t border-border pt-3"}>
            <p className="mb-1 text-xs font-medium text-muted">Needs a follow-up</p>
            <div className="space-y-1">
              {attention.map((j) => (
                <AttentionRow key={j.id} job={j} />
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function TaskRow({ task, overdue }: { task: UpcomingTask; overdue?: boolean }) {
  return (
    <Link to={`/jobs/${task.job_id}`} className="block rounded-lg px-2 py-1.5 hover:bg-surface-hover">
      <p className={`text-sm ${overdue ? "text-danger" : "text-text"}`}>{task.title}</p>
      <p className="text-xs text-muted">
        {task.company}
        {overdue && task.due_date && ` · due ${formatDate(task.due_date)}`}
      </p>
    </Link>
  );
}

function AttentionRow({ job }: { job: AttentionJob }) {
  return (
    <Link to={`/jobs/${job.id}`} className="block rounded-lg px-2 py-1.5 hover:bg-surface-hover">
      <p className="text-sm text-text">
        {job.title} · {job.company}
      </p>
      <p className="text-xs text-muted">{job.stage_name}</p>
    </Link>
  );
}
