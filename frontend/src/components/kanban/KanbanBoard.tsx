import { useMemo, useState } from "react";
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
import { BUCKET_LABELS, BUCKET_ORDER, bucketOf, defaultStageForBucket, groupStagesByBucket, type BucketId } from "@/lib/buckets";
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

function isBucketId(value: string): value is BucketId {
  return (BUCKET_ORDER as string[]).includes(value);
}

export function KanbanBoard({ stages, filters = {} }: KanbanBoardProps) {
  const { data, columns, isLoading, isError, refetch } = useBoardData(filters);
  const { toast } = useToast();
  const moveJob = useMoveJob(filters, () => toast("Move failed — reverted", "error"));

  const [previewColumns, setPreviewColumns] = useState<ColumnMap | null>(null);
  const [quickViewJob, setQuickViewJob] = useState<JobDetail | null>(null);

  const activeColumns = previewColumns ?? columns;

  const stageById = useMemo(() => new Map(stages.map((s) => [s.id, s])), [stages]);
  const bucketsMap = useMemo(() => groupStagesByBucket(stages), [stages]);

  function jobsForBucket(bucket: BucketId): JobDetail[] {
    const memberStages = bucketsMap.get(bucket) ?? [];
    const combined: JobDetail[] = [];
    for (const stage of memberStages) {
      combined.push(...(activeColumns.get(stage.id) ?? []));
    }
    return combined.sort((a, b) => {
      const posA = stageById.get(a.stage_id)?.position ?? 0;
      const posB = stageById.get(b.stage_id)?.position ?? 0;
      return posA - posB || a.position - b.position;
    });
  }

  function bucketOfStageId(stageId: string | undefined): BucketId | undefined {
    const stage = stageId ? stageById.get(stageId) : undefined;
    return stage ? bucketOf(stage) : undefined;
  }

  function resolveTargetBucket(overId: string, source: ColumnMap): BucketId | undefined {
    if (isBucketId(overId)) return overId;
    return bucketOfStageId(findColumnOf(overId, source));
  }

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
      const fromBucket = bucketOfStageId(fromStageId);
      if (!fromStageId || !fromBucket) return prev;

      const toBucket = resolveTargetBucket(overId, prev);
      if (!toBucket || toBucket === fromBucket) return prev;

      const targetStage = defaultStageForBucket(bucketsMap.get(toBucket) ?? []);
      if (!targetStage) return prev;

      const next = cloneColumns(prev);
      const fromJobs = next.get(fromStageId) ?? [];
      const jobIndex = fromJobs.findIndex((j) => j.id === activeId);
      if (jobIndex === -1) return prev;
      const [job] = fromJobs.splice(jobIndex, 1);

      const toJobs = next.get(targetStage.id) ?? [];
      toJobs.push(job);

      next.set(fromStageId, fromJobs);
      next.set(targetStage.id, toJobs);
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
    const fromBucket = bucketOfStageId(originalStageId);
    if (!originalStageId || !fromBucket) return;

    const toBucket = resolveTargetBucket(overId, snapshot);
    if (!toBucket || toBucket === fromBucket) {
      // Same-bucket drop is a no-op — sub-stage changes go through the StageBadge dropdown,
      // since a merged bucket has no single coherent position ordering to reorder within.
      return;
    }

    const targetStage = defaultStageForBucket(bucketsMap.get(toBucket) ?? []);
    if (!targetStage) return;

    const finalColumnJobs = snapshot.get(targetStage.id) ?? [];
    const toIndex = finalColumnJobs.findIndex((j) => j.id === activeId);

    moveJob.mutate({
      jobId: activeId,
      fromStageId: originalStageId,
      toStageId: targetStage.id,
      toIndex: toIndex === -1 ? 0 : toIndex,
    });
  }

  function handleMoveStage(jobId: string, toStageId: string): void {
    const fromStageId = findColumnOf(jobId, columns);
    if (!fromStageId || fromStageId === toStageId) return;
    moveJob.mutate({ jobId, fromStageId, toStageId, toIndex: 0 });
  }

  if (isLoading) {
    return (
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {BUCKET_ORDER.map((bucket) => (
          <div key={bucket} className="w-72 shrink-0 space-y-2">
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
        {BUCKET_ORDER.map((bucket) => (
          <KanbanColumn
            key={bucket}
            id={bucket}
            title={BUCKET_LABELS[bucket]}
            jobs={jobsForBucket(bucket)}
            stages={stages}
            onQuickView={setQuickViewJob}
            onMoveStage={handleMoveStage}
          />
        ))}
      </div>
      <JobQuickView job={quickViewJob} onClose={() => setQuickViewJob(null)} />
    </DndContext>
  );
}
