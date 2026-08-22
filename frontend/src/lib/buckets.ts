import type { Stage, StageType } from "@/types";

export type BucketId = "interested" | "applied" | "in_process" | "offer" | "rejected";

export const BUCKET_ORDER: BucketId[] = ["interested", "applied", "in_process", "offer", "rejected"];

export const BUCKET_LABELS: Record<BucketId, string> = {
  interested: "Interested",
  applied: "Applied",
  in_process: "In Process",
  offer: "Offer",
  rejected: "Rejected",
};

const STAGE_TYPE_TO_BUCKET: Record<StageType, BucketId> = {
  interested: "interested",
  applied: "applied",
  interview: "in_process",
  custom: "in_process",
  offer: "offer",
  rejected: "rejected",
  withdrawn: "rejected",
};

export function bucketOf(stage: Pick<Stage, "stage_type">): BucketId {
  return STAGE_TYPE_TO_BUCKET[stage.stage_type];
}

/** Groups the full stage list into buckets, each stage list sorted by position ascending.
 * All 5 bucket keys are always present (possibly with an empty array), so consumers can
 * render every bucket unconditionally. */
export function groupStagesByBucket(stages: Stage[]): Map<BucketId, Stage[]> {
  const map = new Map<BucketId, Stage[]>(BUCKET_ORDER.map((b) => [b, []]));
  for (const stage of stages) {
    map.get(bucketOf(stage))?.push(stage);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.position - b.position);
  }
  return map;
}

/** The landing stage for a cross-bucket drop: the lowest-position member of the bucket. */
export function defaultStageForBucket(stagesInBucket: Stage[]): Stage | undefined {
  if (stagesInBucket.length === 0) return undefined;
  return [...stagesInBucket].sort((a, b) => a.position - b.position)[0];
}

/** Flattens selected bucket ids into the underlying stage ids, for the `stage_id` csv filter. */
export function stageIdsForBuckets(bucketIds: BucketId[], stages: Stage[]): string[] {
  const wanted = new Set(bucketIds);
  return stages.filter((s) => wanted.has(bucketOf(s))).map((s) => s.id);
}
