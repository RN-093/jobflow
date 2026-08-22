import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

import type { JobFilters } from "@/api/jobs";
import { JobQuickView } from "@/components/kanban/JobQuickView";
import { KanbanColumn } from "@/components/kanban/KanbanColumn";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useBoardData, useMoveJob } from "@/hooks/useBoard";
import type { JobDetail, Stage } from "@/types";

interface KanbanBoardProps {
  stages: Stage[];
  filters?: JobFilters;
}

type ColumnMap = Map<string, JobDetail[]>;

function cloneColumns(columns: ColumnMap): ColumnMap {
  return new Map(Array.from(columns.entries()).map(([stageId, jobs]) => [stageId, [...jobs]]));
}

function findColumnOf(jobId: string, source: ColumnMap): string | undefined {
  for (const [stageId, jobs] of source) {
    if (jobs.some((j) => j.id === jobId)) return stageId;
  }
  return undefined;
}

export function KanbanBoard({ stages, filters = {} }: KanbanBoardProps) {
  const { data, columns, isLoading, isError, refetch } = useBoardData(filters);
  const { toast } = useToast();
  const moveJob = useMoveJob(filters, () => toast("Move failed — reverted", "error"));

  const [previewColumns, setPreviewColumns] = useState<ColumnMap | null>(null);
  const [quickViewJob, setQuickViewJob] = useState<JobDetail | null>(null);

  const activeColumns = previewColumns ?? columns;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(_event: DragStartEvent): void {
    setPreviewColumns(cloneColumns(columns));
  }

  function handleDragOver(event: DragOverEvent): void {
    const { active, over } = event;
    if (!over) return;

    setPreviewColumns((prev) => {
      if (!prev) return prev;
      const activeId = String(active.id);
      const overId = String(over.id);

      const fromStageId = findColumnOf(activeId, prev);
      if (!fromStageId) return prev;

      const overStageId = stages.some((s) => s.id === overId) ? overId : findColumnOf(overId, prev);
      if (!overStageId || fromStageId === overStageId) return prev;

      const next = cloneColumns(prev);
      const fromJobs = next.get(fromStageId) ?? [];
      const jobIndex = fromJobs.findIndex((j) => j.id === activeId);
      if (jobIndex === -1) return prev;
      const [job] = fromJobs.splice(jobIndex, 1);

      const toJobs = next.get(overStageId) ?? [];
      const overIndex = toJobs.findIndex((j) => j.id === overId);
      const insertAt = overIndex === -1 ? toJobs.length : overIndex;
      toJobs.splice(insertAt, 0, job);

      next.set(fromStageId, fromJobs);
      next.set(overStageId, toJobs);
      return next;
    });
  }

  function handleDragEnd(event: DragEndEvent): void {
    const { active, over } = event;
    const snapshot = previewColumns;
    setPreviewColumns(null);

    if (!over || !snapshot) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const originalStageId = findColumnOf(activeId, columns);
    const toStageId = stages.some((s) => s.id === overId) ? overId : findColumnOf(overId, snapshot);

    if (!originalStageId || !toStageId) return;

    const finalColumnJobs = snapshot.get(toStageId) ?? [];
    const toIndex = finalColumnJobs.findIndex((j) => j.id === activeId);
    const originalIndex = columns.get(originalStageId)?.findIndex((j) => j.id === activeId) ?? -1;

    if (originalStageId === toStageId && toIndex === originalIndex) {
      return;
    }

    moveJob.mutate({
      jobId: activeId,
      fromStageId: originalStageId,
      toStageId,
      toIndex: toIndex === -1 ? 0 : toIndex,
    });
  }

  if (isLoading) {
    return (
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <div key={stage.id} className="w-72 shrink-0 space-y-2">
            <Skeleton className="h-8" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} message="Couldn't load the board." />;
  }

  if (!data?.items.length) {
    return (
      <EmptyState
        title="No jobs yet"
        description="Create your first job application to start filling the board."
      />
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <KanbanColumn
            key={stage.id}
            stage={stage}
            jobs={activeColumns.get(stage.id) ?? []}
            onQuickView={setQuickViewJob}
          />
        ))}
      </div>
      <JobQuickView job={quickViewJob} onClose={() => setQuickViewJob(null)} />
    </DndContext>
  );
}
