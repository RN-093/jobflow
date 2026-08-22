import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as jobsApi from "@/api/jobs";
import * as pipelineApi from "@/api/pipeline";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import type { JobDetail } from "@/types";

interface PipelineTabProps {
  job: JobDetail;
}

export function PipelineTab({ job }: PipelineTabProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: stages } = useQuery({ queryKey: ["stages"], queryFn: pipelineApi.listStages });
  const [stageId, setStageId] = useState(job.stage_id);
  const [note, setNote] = useState("");

  const move = useMutation({
    mutationFn: () => jobsApi.moveJobStage(job.id, { stage_id: stageId, note: note || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job", job.id] });
      queryClient.invalidateQueries({ queryKey: ["board"] });
      queryClient.invalidateQueries({ queryKey: ["timeline", job.id] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Stage updated");
      setNote("");
    },
    onError: () => toast("Failed to move stage", "error"),
  });

  return (
    <div className="max-w-md space-y-4">
      <div>
        <p className="text-sm text-muted">Current stage</p>
        <p className="text-lg font-medium text-text">{job.stage_name}</p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Move to</label>
        <Select value={stageId} onChange={(e) => setStageId(e.target.value)}>
          {stages?.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Note (optional)</label>
        <Textarea
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Passed the technical round"
        />
      </div>

      <Button onClick={() => move.mutate()} disabled={move.isPending || stageId === job.stage_id}>
        Move job
      </Button>
    </div>
  );
}
