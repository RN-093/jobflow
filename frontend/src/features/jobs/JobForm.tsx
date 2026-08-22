import { useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";

import * as pipelineApi from "@/api/pipeline";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { EMPLOYMENT_TYPE_OPTIONS, REMOTE_STATUS_OPTIONS, SALARY_PERIOD_OPTIONS } from "@/lib/constants";
import { toDateInputValue } from "@/lib/dates";
import type { JobCreateInput, JobDetail } from "@/types";

interface JobFormProps {
  initial?: Partial<JobDetail>;
  submitLabel?: string;
  onSubmit: (values: JobCreateInput) => Promise<unknown> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

function cleanValues(values: JobCreateInput): JobCreateInput {
  const entries = Object.entries(values).map(([key, value]) => [key, value === "" ? undefined : value]);
  return Object.fromEntries(entries) as JobCreateInput;
}

export function JobForm({ initial, submitLabel = "Save", onSubmit, onCancel, isSubmitting }: JobFormProps) {
  const { data: sources } = useQuery({ queryKey: ["sources"], queryFn: pipelineApi.listSources });

  const [values, setValues] = useState<JobCreateInput>({
    title: initial?.title ?? "",
    company: initial?.company ?? "",
    location: initial?.location ?? "",
    remote_status: initial?.remote_status ?? undefined,
    employment_type: initial?.employment_type ?? undefined,
    salary_min: initial?.salary_min ?? undefined,
    salary_max: initial?.salary_max ?? undefined,
    salary_currency: initial?.salary_currency ?? "USD",
    salary_period: initial?.salary_period ?? "annual",
    source_id: initial?.source_id ?? undefined,
    posting_url: initial?.posting_url ?? "",
    company_website: initial?.company_website ?? "",
    description: initial?.description ?? "",
    reference_id: initial?.reference_id ?? "",
    date_sourced: toDateInputValue(initial?.date_sourced),
    date_applied: toDateInputValue(initial?.date_applied),
    deadline: toDateInputValue(initial?.deadline),
    follow_up_date: toDateInputValue(initial?.follow_up_date),
  });

  function set<K extends keyof JobCreateInput>(key: K, value: JobCreateInput[K]): void {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    await onSubmit(cleanValues(values));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="job-form-title" className="mb-1 block text-xs font-medium text-muted">
            Job title *
          </label>
          <Input id="job-form-title" required value={values.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="job-form-company" className="mb-1 block text-xs font-medium text-muted">
            Company *
          </label>
          <Input
            id="job-form-company"
            required
            value={values.company}
            onChange={(e) => set("company", e.target.value)}
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-xs font-medium text-muted">Location</label>
          <Input value={values.location ?? ""} onChange={(e) => set("location", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Remote</label>
          <Select
            value={values.remote_status ?? ""}
            onChange={(e) => set("remote_status", (e.target.value || undefined) as JobCreateInput["remote_status"])}
          >
            <option value="">—</option>
            {REMOTE_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Employment type</label>
          <Select value={values.employment_type ?? ""} onChange={(e) => set("employment_type", e.target.value || undefined)}>
            <option value="">—</option>
            {EMPLOYMENT_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Salary min</label>
          <Input
            type="number"
            value={values.salary_min ?? ""}
            onChange={(e) => set("salary_min", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Salary max</label>
          <Input
            type="number"
            value={values.salary_max ?? ""}
            onChange={(e) => set("salary_max", e.target.value ? Number(e.target.value) : undefined)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Currency</label>
          <Input value={values.salary_currency ?? ""} maxLength={3} onChange={(e) => set("salary_currency", e.target.value.toUpperCase())} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Salary period</label>
          <Select
            value={values.salary_period ?? ""}
            onChange={(e) => set("salary_period", (e.target.value || undefined) as JobCreateInput["salary_period"])}
          >
            {SALARY_PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted">Source</label>
          <Select value={values.source_id ?? ""} onChange={(e) => set("source_id", e.target.value || undefined)}>
            <option value="">—</option>
            {sources?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-xs font-medium text-muted">Posting URL</label>
          <Input value={values.posting_url ?? ""} onChange={(e) => set("posting_url", e.target.value)} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="mb-1 block text-xs font-medium text-muted">Company website</label>
          <Input value={values.company_website ?? ""} onChange={(e) => set("company_website", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Date sourced</label>
          <Input type="date" value={values.date_sourced ?? ""} onChange={(e) => set("date_sourced", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Date applied</label>
          <Input type="date" value={values.date_applied ?? ""} onChange={(e) => set("date_applied", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Deadline</label>
          <Input type="date" value={values.deadline ?? ""} onChange={(e) => set("deadline", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Follow-up date</label>
          <Input
            type="date"
            value={values.follow_up_date ?? ""}
            onChange={(e) => set("follow_up_date", e.target.value)}
          />
        </div>
        <div className="col-span-2">
          <label className="mb-1 block text-xs font-medium text-muted">Description</label>
          <Textarea rows={3} value={values.description ?? ""} onChange={(e) => set("description", e.target.value)} />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
