import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import type { JobFilters } from "@/api/jobs";
import * as pipelineApi from "@/api/pipeline";
import { SearchBar } from "@/components/layout/SearchBar";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { JobsTable } from "@/features/views/JobsTable";
import { useDebouncedValue } from "@/hooks/useDebounce";
import { REMOTE_STATUS_OPTIONS } from "@/lib/constants";

type SortKey = NonNullable<JobFilters["sort"]>;

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [stageIds, setStageIds] = useState<string[]>([]);
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

  const filters: JobFilters = {
    q: debouncedSearch || undefined,
    stage_id: stageIds.length ? stageIds.join(",") : undefined,
    remote_status: remoteStatus || undefined,
    min_salary: minSalary ? Number(minSalary) : undefined,
    overdue_tasks: overdueOnly || undefined,
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-text">Jobs</h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchBar value={search} onChange={setSearch} className="w-full max-w-xs" />
        <select
          multiple
          value={stageIds}
          onChange={(e) => setStageIds(Array.from(e.target.selectedOptions, (o) => o.value))}
          className="h-9 min-w-[10rem] rounded-xl border border-border bg-surface px-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
          size={1}
          title="Hold Ctrl/Cmd to select multiple stages"
        >
          {stages?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
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
