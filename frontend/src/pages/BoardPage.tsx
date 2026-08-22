import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import * as pipelineApi from "@/api/pipeline";
import { KanbanBoard } from "@/components/kanban/KanbanBoard";
import { Skeleton } from "@/components/ui/Skeleton";
import { BoardFilters } from "@/features/pipeline/BoardFilters";
import { useDebouncedValue } from "@/hooks/useDebounce";

export default function BoardPage() {
  const [search, setSearch] = useState("");
  const [remoteStatus, setRemoteStatus] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data: stages, isLoading } = useQuery({ queryKey: ["stages"], queryFn: pipelineApi.listStages });

  return (
    <div className="flex h-full flex-col">
      <h1 className="mb-4 text-xl font-semibold text-text">Pipeline</h1>
      <BoardFilters
        search={search}
        onSearchChange={setSearch}
        remoteStatus={remoteStatus}
        onRemoteStatusChange={setRemoteStatus}
      />
      {isLoading || !stages ? (
        <div className="flex gap-4">
          <Skeleton className="h-64 w-72" />
          <Skeleton className="h-64 w-72" />
          <Skeleton className="h-64 w-72" />
        </div>
      ) : (
        <KanbanBoard
          stages={stages}
          filters={{ q: debouncedSearch || undefined, remote_status: remoteStatus || undefined }}
        />
      )}
    </div>
  );
}
