import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import * as jobsApi from "@/api/jobs";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { JobForm } from "@/features/jobs/JobForm";
import type { JobCreateInput, JobDetail } from "@/types";

interface OverviewTabProps {
  job: JobDetail;
}

export function OverviewTab({ job }: OverviewTabProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function invalidate(): void {
    queryClient.invalidateQueries({ queryKey: ["job", job.id] });
    queryClient.invalidateQueries({ queryKey: ["board"] });
    queryClient.invalidateQueries({ queryKey: ["jobs"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  }

  const update = useMutation({
    mutationFn: (values: JobCreateInput) => jobsApi.updateJob(job.id, values),
    onSuccess: () => {
      invalidate();
      toast("Job updated");
    },
    onError: () => toast("Failed to update job", "error"),
  });

  const archive = useMutation({
    mutationFn: () => jobsApi.archiveJob(job.id, !job.archived),
    onSuccess: () => {
      invalidate();
      toast(job.archived ? "Job restored" : "Job archived");
    },
  });

  const remove = useMutation({
    mutationFn: () => jobsApi.deleteJob(job.id),
    onSuccess: () => {
      invalidate();
      toast("Job deleted");
      navigate("/board");
    },
  });

  return (
    <div className="space-y-6">
      <JobForm
        initial={job}
        submitLabel="Save changes"
        isSubmitting={update.isPending}
        onSubmit={(values) => update.mutateAsync(values)}
      />

      <div className="flex items-center gap-2 border-t border-border pt-4">
        <Button variant="secondary" size="sm" onClick={() => archive.mutate()}>
          {job.archived ? "Restore job" : "Archive job"}
        </Button>
        <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
          Delete job
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this job?"
        message="This permanently removes the job and all of its interviews, contacts, tasks, and notes."
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          setConfirmDelete(false);
          remove.mutate();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
