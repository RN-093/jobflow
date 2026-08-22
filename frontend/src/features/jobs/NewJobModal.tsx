import { useMutation, useQueryClient } from "@tanstack/react-query";

import * as jobsApi from "@/api/jobs";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { JobForm } from "@/features/jobs/JobForm";
import type { JobCreateInput } from "@/types";

interface NewJobModalProps {
  open: boolean;
  onClose: () => void;
}

export function NewJobModal({ open, onClose }: NewJobModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (values: JobCreateInput) => jobsApi.createJob(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["board"] });
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast("Job created");
      onClose();
    },
    onError: () => {
      toast("Failed to create job", "error");
    },
  });

  return (
    <Modal open={open} onClose={onClose} title="New job" className="max-w-2xl">
      <JobForm
        submitLabel="Create job"
        onCancel={onClose}
        isSubmitting={mutation.isPending}
        onSubmit={(values) => mutation.mutateAsync(values)}
      />
    </Modal>
  );
}
