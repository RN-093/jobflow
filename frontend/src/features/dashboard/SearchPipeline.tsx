import { Link } from "react-router-dom";

import { cn } from "@/lib/cn";
import type { BucketId } from "@/lib/buckets";
import type { DashboardStats } from "@/types";

interface SearchPipelineProps {
  stats: DashboardStats;
}

const STAGES: { key: keyof DashboardStats; label: string; buckets: BucketId[] }[] = [
  { key: "total_active", label: "Active", buckets: ["interested", "applied", "in_process"] },
  { key: "interested", label: "Interested", buckets: ["interested"] },
  { key: "applied", label: "Applied", buckets: ["applied"] },
  { key: "interviews", label: "Interviewing", buckets: ["in_process"] },
  { key: "offers", label: "Offers", buckets: ["offer"] },
];

export function SearchPipeline({ stats }: SearchPipelineProps) {
  const secondary: { label: string; count: number }[] = [
    { label: "rejected", count: stats.rejected },
    { label: "withdrawn", count: stats.withdrawn },
  ].filter((s) => s.count > 0);

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Your search</p>
      <div className="overflow-x-auto rounded-xl border border-border bg-surface">
        <div className="flex divide-x divide-border">
          {STAGES.map(({ key, label, buckets }) => {
            const value = stats[key];
            return (
              <Link
                key={key}
                to="/jobs"
                state={{ buckets }}
                className="flex min-w-[6rem] flex-1 flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-surface-hover"
              >
                <span className={cn("text-2xl font-semibold", value > 0 ? "text-text" : "text-muted/60")}>{value}</span>
                <span className="text-xs text-muted">{label}</span>
              </Link>
            );
          })}
        </div>
      </div>
      {secondary.length > 0 && (
        <p className="mt-2 text-xs text-muted">
          {secondary.map((s, i) => (
            <span key={s.label}>
              {i > 0 && " · "}
              <Link to="/jobs" state={{ buckets: ["rejected"] }} className="hover:text-text hover:underline">
                {s.count} {s.label}
              </Link>
            </span>
          ))}
        </p>
      )}
    </div>
  );
}
