import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { JobCard } from "@/components/kanban/JobCard";
import { cn } from "@/lib/cn";
import type { JobDetail, Stage } from "@/types";

interface KanbanColumnProps {
  id: string;
  title: string;
  jobs: JobDetail[];
  stages: Stage[];
  onQuickView: (job: JobDetail) => void;
  onMoveStage: (jobId: string, toStageId: string) => void;
}

export function KanbanColumn({ id, title, jobs, stages, onQuickView, onMoveStage }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-surface/60">
      <div className="flex items-center gap-2 px-3 py-2">
        <h3 className="truncate text-sm font-semibold text-text">{title}</h3>
        <span className="ml-auto shrink-0 rounded-full bg-surface-hover px-2 py-0.5 text-xs text-muted">
          {jobs.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[140px] flex-1 flex-col gap-2 rounded-xl p-2 transition-colors",
          isOver && "bg-accent/5 ring-2 ring-accent/30"
        )}
      >
        <SortableContext items={jobs.map((j) => j.id)} strategy={verticalListSortingStrategy}>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} stages={stages} onQuickView={onQuickView} onMoveStage={onMoveStage} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
