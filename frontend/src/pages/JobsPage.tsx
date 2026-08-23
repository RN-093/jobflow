import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

import type { JobFilters } from "@/api/jobs";
import * as pipelineApi from "@/api/pipeline";
import { SearchBar } from "@/components/layout/SearchBar";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { JobsTable } from "@/features/views/JobsTable";
import { useDebouncedValue } from "@/hooks/useDebounce";
import { BUCKET_LABELS, BUCKET_ORDER, stageIdsForBuckets, type BucketId } from "@/lib/buckets";
import { cn } from "@/lib/cn";
import { REMOTE_STATUS_OPTIONS } from "@/lib/constants";

type SortKey = NonNullable<JobFilters["sort"]>;

// The Jobs-page filter surfaces "Rejection" (matching the user-facing filter wording) while
// the board bucket of the same id is titled "Rejected" — a deliberate, purely cosmetic difference.
const FILTER_LABELS: Record<BucketId, string> = { ...BUCKET_LABELS, rejected: "Rejection" };

export default function JobsPage() {
  const location = useLocation();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [selectedBuckets, setSelectedBuckets] = useState<BucketId[]>(
    () => (location.state as { buckets?: BucketId[] } | null)?.buckets ?? []
  );
  const [remoteStatus, setRemoteStatus] = useState("");
  const [minSalary, setMinSalary] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("last_activity");
  const [order, setOrder] = useState<NonNullable<JobFilters["order"]>>("desc");

  const { data: stages } = useQuery({ queryKey: ["stages"], queryFn: pipelineApi.listStages });

  function handleSortChange(nextSort: SortKey): void {
    if (nextSort === sort) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSort(nextSort);
      setOrder("desc");
    }
  }

  function toggleBucket(bucket: BucketId): void {
    setSelectedBuckets((prev) => (prev.includes(bucket) ? prev.filter((b) => b !== bucket) : [...prev, bucket]));
  }

  const filters: JobFilters = {
    q: debouncedSearch || undefined,
    stage_id:
      selectedBuckets.length && stages ? stageIdsForBuckets(selectedBuckets, stages).join(",") || undefined : undefined,
    remote_status: remoteStatus || undefined,
    min_salary: minSalary ? Number(minSalary) : undefined,
    overdue_tasks: overdueOnly || undefined,
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-text">Jobs</h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchBar value={search} onChange={setSearch} className="w-full max-w-xs" />

        {stages && (
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by job stage">
            {BUCKET_ORDER.map((bucket) => (
              <button
                key={bucket}
                type="button"
                onClick={() => toggleBucket(bucket)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  selectedBuckets.includes(bucket)
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface text-muted hover:bg-surface-hover hover:text-text"
                )}
              >
                {FILTER_LABELS[bucket]}
              </button>
            ))}
          </div>
        )}

        <Select value={remoteStatus} onChange={(e) => setRemoteStatus(e.target.value)} className="w-auto">
          <option value="">All locations</option>
          {REMOTE_STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Input
          type="number"
          placeholder="Min salary"
          value={minSalary}
          onChange={(e) => setMinSalary(e.target.value)}
          className="w-32"
        />
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={overdueOnly}
            onChange={(e) => setOverdueOnly(e.target.checked)}
            className="h-4 w-4 accent-accent"
          />
          Overdue tasks
        </label>
      </div>

      <JobsTable filters={filters} sort={sort} order={order} onSortChange={handleSortChange} />
    </div>
  );
}
