import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as jobsApi from "@/api/jobs";
import type { JobFilters } from "@/api/jobs";
import type { JobDetail, Paginated, StageMoveInput } from "@/types";

export function boardQueryKey(filters: JobFilters): readonly [string, string] {
  return ["board", JSON.stringify(filters)] as const;
}

export function useBoardData(filters: JobFilters = {}) {
  const query = useQuery({
    queryKey: boardQueryKey(filters),
    queryFn: () => jobsApi.listJobs({ ...filters, page_size: 1000, archived: filters.archived ?? false }),
  });

  const columns = useMemo(() => {
    const grouped = new Map<string, JobDetail[]>();
    for (const job of query.data?.items ?? []) {
      const list = grouped.get(job.stage_id) ?? [];
      list.push(job);
      grouped.set(job.stage_id, list);
    }
    for (const list of grouped.values()) {
      list.sort((a, b) => a.position - b.position);
    }
    return grouped;
  }, [query.data]);

  return { ...query, columns };
}

export interface MoveVars {
  jobId: string;
  fromStageId: string;
  toStageId: string;
  toIndex: number;
}

function applyOptimisticMove(
  data: Paginated<JobDetail> | undefined,
  vars: MoveVars
): Paginated<JobDetail> | undefined {
  if (!data) return data;
  const items = data.items.map((j) => ({ ...j }));
  const moving = items.find((j) => j.id === vars.jobId);
  if (!moving) return data;

  const sameColumn = vars.fromStageId === vars.toStageId;

  const targetColumn = items
    .filter((j) => j.stage_id === vars.toStageId && j.id !== vars.jobId)
    .sort((a, b) => a.position - b.position);
  const clampedIndex = Math.max(0, Math.min(vars.toIndex, targetColumn.length));
  targetColumn.splice(clampedIndex, 0, moving);
  targetColumn.forEach((job, index) => {
    job.position = index;
    job.stage_id = vars.toStageId;
  });

  if (!sameColumn) {
    const sourceColumn = items
      .filter((j) => j.stage_id === vars.fromStageId && j.id !== vars.jobId)
      .sort((a, b) => a.position - b.position);
    sourceColumn.forEach((job, index) => {
      job.position = index;
    });
  }

  return { ...data, items };
}

export function useMoveJob(filters: JobFilters = {}, onError?: () => void) {
  const queryClient = useQueryClient();
  const key = boardQueryKey(filters);

  return useMutation({
    mutationFn: (vars: MoveVars) => {
      const input: StageMoveInput = { stage_id: vars.toStageId, position: vars.toIndex };
      return jobsApi.moveJobStage(vars.jobId, input);
    },
    onMutate: async (vars: MoveVars) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Paginated<JobDetail>>(key);
      queryClient.setQueryData<Paginated<JobDetail>>(key, (old) => applyOptimisticMove(old, vars));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(key, context.previous);
      }
      onError?.();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
