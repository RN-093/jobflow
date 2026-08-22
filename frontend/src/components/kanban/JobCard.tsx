import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AlertCircle, CalendarClock, Eye, Flag } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { StageBadge } from "@/components/kanban/StageBadge";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { activityDotColor, formatDate, isOverdue } from "@/lib/dates";
import { formatSalaryRange } from "@/lib/money";
import type { JobDetail, Stage } from "@/types";

interface JobCardProps {
  job: JobDetail;
  stages: Stage[];
  onQuickView: (job: JobDetail) => void;
  onMoveStage: (jobId: string, toStageId: string) => void;
}

const DOT_COLOR_CLASSES: Record<string, string> = {
  green: "bg-success",
  amber: "bg-warning",
  red: "bg-danger",
};

export function JobCard({ job, stages, onQuickView, onMoveStage }: JobCardProps) {
  const navigate = useNavigate();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: job.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const salary = formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency, job.salary_period);
  const overdue = job.overdue_task_count > 0;
  const followUpDue = isOverdue(job.follow_up_date) || job.follow_up_date === new Date().toISOString().slice(0, 10);
  const dot = activityDotColor(job.last_activity_at);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      interactive
      padding="sm"
      onClick={() => navigate(`/jobs/${job.id}`)}
      data-testid="job-card"
      data-job-id={job.id}
      className={cn("group relative cursor-pointer touch-none", isDragging && "opacity-50")}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-text">{job.title}</p>
          <p className="truncate text-xs text-muted">{job.company}</p>
        </div>
        <span
          className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", DOT_COLOR_CLASSES[dot])}
          title="Days since last activity"
        />
      </div>

      <div className="mt-2">
        <StageBadge job={job} stages={stages} onMove={(toStageId) => onMoveStage(job.id, toStageId)} />
      </div>

      {salary && <p className="mt-2 text-xs font-medium text-text">{salary}</p>}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {job.next_interview_at && (
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent">
            <CalendarClock size={11} />
            {formatDate(job.next_interview_at, "MMM d")}
          </span>
        )}
        {overdue && (
          <span className="inline-flex items-center gap-1 rounded-full bg-danger/10 px-2 py-0.5 text-[11px] font-medium text-danger">
            <AlertCircle size={11} />
            {job.overdue_task_count} overdue
          </span>
        )}
        {followUpDue && (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
            <Flag size={11} />
            Follow up
          </span>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onQuickView(job);
        }}
        className="absolute right-2 top-2 hidden rounded-lg bg-surface p-1 text-muted shadow-sm hover:bg-surface-hover group-hover:flex"
        aria-label="Quick view"
        type="button"
      >
        <Eye size={14} />
      </button>
    </Card>
  );
}
