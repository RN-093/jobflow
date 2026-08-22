import { describe, expect, it } from "vitest";

import { bucketOf, defaultStageForBucket, groupStagesByBucket, stageIdsForBuckets } from "@/lib/buckets";
import type { Stage } from "@/types";

function stage(overrides: Partial<Stage>): Stage {
  return {
    id: "s",
    name: "Stage",
    position: 0,
    color: "#000000",
    stage_type: "custom",
    is_default: false,
    created_at: "2026-01-01T00:00:00",
    job_count: 0,
    ...overrides,
  };
}

describe("bucketOf", () => {
  it("maps interview and custom stage types to in_process", () => {
    expect(bucketOf(stage({ stage_type: "interview" }))).toBe("in_process");
    expect(bucketOf(stage({ stage_type: "custom" }))).toBe("in_process");
  });

  it("maps rejected and withdrawn stage types to rejected", () => {
    expect(bucketOf(stage({ stage_type: "rejected" }))).toBe("rejected");
    expect(bucketOf(stage({ stage_type: "withdrawn" }))).toBe("rejected");
  });

  it("maps interested/applied/offer 1:1", () => {
    expect(bucketOf(stage({ stage_type: "interested" }))).toBe("interested");
    expect(bucketOf(stage({ stage_type: "applied" }))).toBe("applied");
    expect(bucketOf(stage({ stage_type: "offer" }))).toBe("offer");
  });
});

describe("groupStagesByBucket", () => {
  const stages: Stage[] = [
    stage({ id: "a", stage_type: "interested", position: 0 }),
    stage({ id: "b", stage_type: "interview", position: 3 }),
    stage({ id: "c", stage_type: "interview", position: 2 }),
    stage({ id: "d", stage_type: "custom", position: 5 }),
    stage({ id: "e", stage_type: "withdrawn", position: 10 }),
    stage({ id: "f", stage_type: "rejected", position: 9 }),
  ];

  it("always includes all 5 buckets, even when empty", () => {
    const map = groupStagesByBucket(stages);
    expect([...map.keys()]).toEqual(["interested", "applied", "in_process", "offer", "rejected"]);
    expect(map.get("applied")).toEqual([]);
    expect(map.get("offer")).toEqual([]);
  });

  it("merges interview and custom stages into in_process, sorted by position", () => {
    const map = groupStagesByBucket(stages);
    expect(map.get("in_process")?.map((s) => s.id)).toEqual(["c", "b", "d"]);
  });

  it("merges rejected and withdrawn into rejected, sorted by position", () => {
    const map = groupStagesByBucket(stages);
    expect(map.get("rejected")?.map((s) => s.id)).toEqual(["f", "e"]);
  });
});

describe("defaultStageForBucket", () => {
  it("returns the lowest-position member stage", () => {
    const members = [stage({ id: "x", position: 5 }), stage({ id: "y", position: 2 })];
    expect(defaultStageForBucket(members)?.id).toBe("y");
  });

  it("returns undefined for an empty bucket", () => {
    expect(defaultStageForBucket([])).toBeUndefined();
  });
});

describe("stageIdsForBuckets", () => {
  it("flattens selected buckets into their member stage ids", () => {
    const stages: Stage[] = [
      stage({ id: "a", stage_type: "interested" }),
      stage({ id: "b", stage_type: "interview" }),
      stage({ id: "c", stage_type: "offer" }),
    ];
    expect(stageIdsForBuckets(["interested", "offer"], stages).sort()).toEqual(["a", "c"]);
  });
});
