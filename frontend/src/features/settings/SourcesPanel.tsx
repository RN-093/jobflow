import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as pipelineApi from "@/api/pipeline";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export function SourcesPanel() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: sources } = useQuery({ queryKey: ["sources"], queryFn: pipelineApi.listSources });
  const [name, setName] = useState("");

  const create = useMutation({
    mutationFn: () => pipelineApi.createSource(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sources"] });
      setName("");
      toast("Source added");
    },
    onError: () => toast("Failed to add source", "error"),
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {sources?.map((source) => (
          <span key={source.id} className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-text">
            {source.name}
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <Input placeholder="New source" value={name} onChange={(e) => setName(e.target.value)} className="max-w-xs" />
        <Button size="sm" disabled={!name || create.isPending} onClick={() => create.mutate()}>
          Add
        </Button>
      </div>
    </div>
  );
}
