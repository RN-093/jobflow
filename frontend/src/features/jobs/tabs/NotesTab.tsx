import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import * as childrenApi from "@/api/children";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { useNotes } from "@/hooks/useJob";
import { formatDateTime } from "@/lib/dates";

interface NotesTabProps {
  jobId: string;
}

export function NotesTab({ jobId }: NotesTabProps) {
  const { data, isLoading, isError, refetch } = useNotes(jobId);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [body, setBody] = useState("");

  function invalidate(): void {
    queryClient.invalidateQueries({ queryKey: ["notes", jobId] });
    queryClient.invalidateQueries({ queryKey: ["timeline", jobId] });
  }

  const create = useMutation({
    mutationFn: () => childrenApi.createNote(jobId, { body }),
    onSuccess: () => {
      invalidate();
      setBody("");
      toast("Note added");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => childrenApi.deleteNote(jobId, id),
    onSuccess: () => {
      invalidate();
      toast("Note removed");
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div>
      <div className="mb-4 space-y-2">
        <Textarea rows={3} placeholder="Add a note..." value={body} onChange={(e) => setBody(e.target.value)} />
        <div className="flex justify-end">
          <Button size="sm" disabled={!body || create.isPending} onClick={() => create.mutate()}>
            Add note
          </Button>
        </div>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState title="No notes yet" />
      ) : (
        <div className="space-y-3">
          {data.map((note) => (
            <Card key={note.id}>
              <p className="whitespace-pre-wrap text-sm text-text">{note.body}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-muted">{formatDateTime(note.created_at)}</p>
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(note.id)}>
                  Remove
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
