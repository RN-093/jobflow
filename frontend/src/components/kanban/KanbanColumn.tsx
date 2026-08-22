import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

import { JobCard } from "@/components/kanban/JobCard";
import { cn } from "@/lib/cn";
import type { JobDetail, Stage } from "@/types";

interface KanbanColumnProps {
  stage: Stage;
  jobs: JobDetail[];
  onQuickView: (job: JobDetail) => void;
}

export function KanbanColumn({ stage, jobs, onQuickView }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-surface/60">
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: stage.color }} />
        <h3 className="truncate text-sm font-semibold text-text">{stage.name}</h3>
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
            <JobCard key={job.id} job={job} onQuickView={onQuickView} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
