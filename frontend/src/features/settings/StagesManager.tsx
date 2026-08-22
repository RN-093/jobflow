import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";

import { ApiError } from "@/api/client";
import * as pipelineApi from "@/api/pipeline";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { STAGE_COLORS } from "@/lib/constants";
import type { Stage, StageType } from "@/types";

const STAGE_TYPES: StageType[] = ["interested", "applied", "interview", "offer", "rejected", "withdrawn", "custom"];

export function StagesManager() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: stages } = useQuery({ queryKey: ["stages"], queryFn: pipelineApi.listStages });
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(STAGE_COLORS[0]);
  const [deleteTarget, setDeleteTarget] = useState<Stage | null>(null);

  function invalidate(): void {
    queryClient.invalidateQueries({ queryKey: ["stages"] });
  }

  const create = useMutation({
    mutationFn: () => pipelineApi.createStage({ name: newName, color: newColor, stage_type: "custom" }),
    onSuccess: () => {
      invalidate();
      setNewName("");
      toast("Stage added");
    },
    onError: (err) => toast(err instanceof ApiError ? err.message : "Failed to add stage", "error"),
  });

  const update = useMutation({
    mutationFn: ({ id, ...rest }: { id: string; name?: string; color?: string; stage_type?: StageType }) =>
      pipelineApi.updateStage(id, rest),
    onSuccess: () => invalidate(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => pipelineApi.deleteStage(id),
    onSuccess: () => {
      invalidate();
      toast("Stage deleted");
    },
    onError: (err) => toast(err instanceof ApiError ? err.message : "Failed to delete stage", "error"),
  });

  const reorder = useMutation({
    mutationFn: (orderedIds: string[]) => pipelineApi.reorderStages(orderedIds),
    onSuccess: () => invalidate(),
  });

  function move(index: number, direction: -1 | 1): void {
    if (!stages) return;
    const next = [...stages];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next.map((s) => s.id));
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {stages?.map((stage, index) => (
          <div
            key={stage.id}
            className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-3"
          >
            <div className="flex flex-col gap-0.5">
              <button
                disabled={index === 0}
                onClick={() => move(index, -1)}
                className="text-muted hover:text-text disabled:opacity-30"
                aria-label="Move up"
                type="button"
              >
                <ArrowUp size={14} />
              </button>
              <button
                disabled={index === stages.length - 1}
                onClick={() => move(index, 1)}
                className="text-muted hover:text-text disabled:opacity-30"
                aria-label="Move down"
                type="button"
              >
                <ArrowDown size={14} />
              </button>
            </div>
            <input
              type="color"
              value={stage.color}
              onChange={(e) => update.mutate({ id: stage.id, color: e.target.value })}
              className="h-8 w-8 shrink-0 cursor-pointer rounded border border-border"
              aria-label={`Color for ${stage.name}`}
            />
            <Input
              defaultValue={stage.name}
              onBlur={(e) => {
                if (e.target.value && e.target.value !== stage.name) {
                  update.mutate({ id: stage.id, name: e.target.value });
                }
              }}
              className="max-w-[180px]"
            />
            <Select
              value={stage.stage_type}
              onChange={(e) => update.mutate({ id: stage.id, stage_type: e.target.value as StageType })}
              className="w-36"
            >
              {STAGE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <span className="text-xs text-muted">{stage.job_count} job(s)</span>
            <button
              onClick={() => setDeleteTarget(stage)}
              className="ml-auto rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger"
              aria-label="Delete stage"
              type="button"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="h-9 w-9 cursor-pointer rounded border border-border"
          aria-label="New stage color"
        />
        <Input
          placeholder="New stage name"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          className="max-w-[200px]"
        />
        <Button size="sm" disabled={!newName || create.isPending} onClick={() => create.mutate()}>
          Add stage
        </Button>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete stage?"
        message={`This removes "${deleteTarget?.name}". Jobs must be moved out of it first — the server will refuse if it's not empty.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          if (deleteTarget) remove.mutate(deleteTarget.id);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
