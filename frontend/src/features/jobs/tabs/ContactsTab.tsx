import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import * as childrenApi from "@/api/children";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { useContacts } from "@/hooks/useJob";
import type { ContactInput } from "@/types";

interface ContactsTabProps {
  jobId: string;
}

export function ContactsTab({ jobId }: ContactsTabProps) {
  const { data, isLoading, isError, refetch } = useContacts(jobId);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ContactInput>({ name: "" });

  function invalidate(): void {
    queryClient.invalidateQueries({ queryKey: ["contacts", jobId] });
    queryClient.invalidateQueries({ queryKey: ["timeline", jobId] });
  }

  const create = useMutation({
    mutationFn: () => childrenApi.createContact(jobId, form),
    onSuccess: () => {
      invalidate();
      toast("Contact added");
      setModalOpen(false);
      setForm({ name: "" });
    },
    onError: () => toast("Failed to add contact", "error"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => childrenApi.deleteContact(jobId, id),
    onSuccess: () => {
      invalidate();
      toast("Contact removed");
    },
  });

  if (isLoading) return <Skeleton className="h-48 w-full" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setModalOpen(true)}>
          Add contact
        </Button>
      </div>

      {!data || data.length === 0 ? (
        <EmptyState title="No contacts yet" />
      ) : (
        <div className="space-y-3">
          {data.map((contact) => (
            <div
              key={contact.id}
              className="flex items-start justify-between rounded-xl border border-border bg-surface p-4"
            >
              <div>
                <p className="font-medium text-text">{contact.name}</p>
                {contact.job_title && <p className="text-sm text-muted">{contact.job_title}</p>}
                {contact.email && <p className="text-sm text-muted">{contact.email}</p>}
                {contact.phone && <p className="text-sm text-muted">{contact.phone}</p>}
              </div>
              <Button size="sm" variant="ghost" onClick={() => remove.mutate(contact.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add contact">
        <div className="space-y-3">
          <Input
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <Input
            placeholder="Job title"
            value={form.job_title ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, job_title: e.target.value }))}
          />
          <Input
            placeholder="Email"
            value={form.email ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <Input
            placeholder="Phone"
            value={form.phone ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!form.name || create.isPending} onClick={() => create.mutate()}>
              Add
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
