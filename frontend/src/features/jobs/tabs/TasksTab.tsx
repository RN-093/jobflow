import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import * as childrenApi from "@/api/children";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useTasks } from "@/hooks/useJob";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/dates";
import type { Task } from "@/types";

interface TasksTabProps {
  jobId: string;
}

export function TasksTab({ jobId }: TasksTabProps) {
  const { data, isLoading, isError, refetch } = useTasks(jobId);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");

  function invalidate(): void {
    queryClient.invalidateQueries({ queryKey: ["tasks", jobId] });
    queryClient.invalidateQueries({ queryKey: ["timeline", jobId] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }

  const create = useMutation({
    mutationFn: () => childrenApi.createTask(jobId, { title, due_date: dueDate || undefined }),
    onSuccess: () => {
      invalidate();
      setTitle("");
      setDueDate("");
      toast("Task added");
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      childrenApi.updateTask(jobId, id, { completed }),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks", jobId] });
      const previous = queryClient.getQueryData<Task[]>(["tasks", jobId]);
      queryClient.setQueryData<Task[]>(["tasks", jobId], (old) =>
        old?.map((t) => (t.id === id ? { ...t, completed } : t))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(["tasks", jobId], context.previous);
      toast("Failed to update task", "error");
    },
    onSettled: () => invalidate(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => childrenApi.deleteTask(jobId, id),
    onSuccess: () => {
      invalidate();
      toast("Task removed");
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Input placeholder="New task" value={title} onChange={(e) => setTitle(e.target.value)} className="max-w-xs" />
        <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="w-40" />
        <Button size="sm" disabled={!title || create.isPending} onClick={() => create.mutate()}>
          Add
        </Button>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState title="No tasks yet" />
      ) : (
        <div className="space-y-2">
          {data.map((task) => (
            <Card key={task.id} padding="sm" className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={(e) => toggle.mutate({ id: task.id, completed: e.target.checked })}
                className="h-4 w-4 accent-accent"
              />
              <div className="flex-1">
                <p className={cn("text-sm text-text", task.completed && "text-muted line-through")}>{task.title}</p>
                {task.due_date && <p className="text-xs text-muted">Due {formatDate(task.due_date)}</p>}
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove.mutate(task.id)}>
                Remove
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
