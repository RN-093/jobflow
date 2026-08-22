import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { bucketOf } from "@/lib/buckets";
import { cn } from "@/lib/cn";
import type { JobDetail, Stage } from "@/types";

interface StageBadgeProps {
  job: Pick<JobDetail, "stage_id" | "stage_name">;
  stages: Stage[];
  onMove: (toStageId: string) => void;
  disabled?: boolean;
  className?: string;
}

export function StageBadge({ job, stages, onMove, disabled, className }: StageBadgeProps) {
  const [open, setOpen] = useState(false);

  const currentStage = stages.find((s) => s.id === job.stage_id);
  const color = currentStage?.color ?? "#94a3b8";
  const bucket = currentStage ? bucketOf(currentStage) : null;
  const siblings = bucket
    ? stages.filter((s) => bucketOf(s) === bucket).sort((a, b) => a.position - b.position)
    : [];

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-80 disabled:pointer-events-none disabled:opacity-50"
        style={{ backgroundColor: `${color}1f`, color }}
      >
        {job.stage_name ?? currentStage?.name ?? "Unknown"}
        <ChevronDown size={11} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div
            className="absolute left-0 z-50 mt-1 min-w-[10rem] rounded-xl border border-border bg-surface p-1 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {siblings.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setOpen(false);
                  if (s.id !== job.stage_id) onMove(s.id);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs hover:bg-surface-hover",
                  s.id === job.stage_id ? "font-semibold text-text" : "text-muted"
                )}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                {s.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
