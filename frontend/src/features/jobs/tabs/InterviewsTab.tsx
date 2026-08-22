import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as childrenApi from "@/api/children";
import * as pipelineApi from "@/api/pipeline";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { useInterviews } from "@/hooks/useJob";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/dates";
import type { InterviewInput } from "@/types";

interface InterviewsTabProps {
  jobId: string;
}

export function InterviewsTab({ jobId }: InterviewsTabProps) {
  const { data, isLoading, isError, refetch } = useInterviews(jobId);
  const { data: interviewTypes } = useQuery({
    queryKey: ["interview-types"],
    queryFn: pipelineApi.getInterviewTypes,
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [feedbackFor, setFeedbackFor] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [form, setForm] = useState<InterviewInput>({ type_label: "", scheduled_at: "" });

  function invalidate(): void {
    queryClient.invalidateQueries({ queryKey: ["interviews", jobId] });
    queryClient.invalidateQueries({ queryKey: ["timeline", jobId] });
    queryClient.invalidateQueries({ queryKey: ["job", jobId] });
    queryClient.invalidateQueries({ queryKey: ["board"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["interview-types"] });
  }

  const create = useMutation({
    mutationFn: () => childrenApi.createInterview(jobId, form),
    onSuccess: () => {
      invalidate();
      toast("Interview scheduled");
      setModalOpen(false);
      setForm({ type_label: "", scheduled_at: "" });
    },
    onError: () => toast("Failed to schedule interview", "error"),
  });

  const complete = useMutation({
    mutationFn: (id: string) => childrenApi.updateInterview(jobId, id, { status: "completed", feedback }),
    onSuccess: () => {
      invalidate();
      toast("Interview marked complete");
      setFeedbackFor(null);
      setFeedback("");
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => childrenApi.deleteInterview(jobId, id),
    onSuccess: () => {
      invalidate();
      toast("Interview removed");
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const allTypes = [...(interviewTypes?.defaults ?? []), ...(interviewTypes?.custom ?? [])];

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setModalOpen(true)}>
          Schedule interview
        </Button>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState title="No interviews yet" description="Schedule one to keep track of upcoming rounds." />
      ) : (
        <div className="space-y-3">
          {data.map((interview) => (
            <div key={interview.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-text">{interview.type_label}</p>
                  <p className="text-sm text-muted">{formatDateTime(interview.scheduled_at)}</p>
                  {interview.interviewers && (
                    <p className="mt-1 text-xs text-muted">With {interview.interviewers}</p>
                  )}
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
                    interview.status === "completed" ? "bg-success/10 text-success" : "bg-accent/10 text-accent"
                  )}
                >
                  {interview.status}
                </span>
              </div>
              {interview.feedback && <p className="mt-2 text-sm text-text">{interview.feedback}</p>}
              <div className="mt-3 flex gap-2">
                {interview.status !== "completed" && (
                  <Button size="sm" variant="secondary" onClick={() => setFeedbackFor(interview.id)}>
                    Mark complete
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(interview.id)}>
                  Remove
                </Button>
              </div>
              {feedbackFor === interview.id && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    rows={2}
                    placeholder="Feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                  />
                  <Button size="sm" onClick={() => complete.mutate(interview.id)}>
                    Save
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Schedule interview">
        <div className="space-y-3">
          <div>
            <label htmlFor="interview-type" className="mb-1 block text-xs font-medium text-muted">
              Type
            </label>
            <Select
              id="interview-type"
              value={form.type_label}
              onChange={(e) => setForm((f) => ({ ...f, type_label: e.target.value }))}
            >
              <option value="">Select a type</option>
              {allTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label htmlFor="interview-scheduled-at" className="mb-1 block text-xs font-medium text-muted">
              Date &amp; time
            </label>
            <Input
              id="interview-scheduled-at"
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => setForm((f) => ({ ...f, scheduled_at: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">Interviewers</label>
            <Input
              value={form.interviewers ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, interviewers: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!form.type_label || !form.scheduled_at || create.isPending} onClick={() => create.mutate()}>
              Schedule
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
