import { X } from "lucide-react";
import { Link } from "react-router-dom";

import { formatDate } from "@/lib/dates";
import { formatSalaryRange } from "@/lib/money";
import type { JobDetail } from "@/types";

interface JobQuickViewProps {
  job: JobDetail | null;
  onClose: () => void;
}

export function JobQuickView({ job, onClose }: JobQuickViewProps) {
  if (!job) return null;

  const salary = formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency, job.salary_period);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="h-full w-full max-w-sm overflow-y-auto bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text">{job.title}</h2>
            <p className="text-sm text-muted">{job.company}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:bg-surface-hover"
            aria-label="Close"
            type="button"
          >
            <X size={18} />
          </button>
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs uppercase text-muted">Stage</dt>
            <dd className="text-text">{job.stage_name}</dd>
          </div>
          {salary && (
            <div>
              <dt className="text-xs uppercase text-muted">Salary</dt>
              <dd className="text-text">{salary}</dd>
            </div>
          )}
          {job.location && (
            <div>
              <dt className="text-xs uppercase text-muted">Location</dt>
              <dd className="text-text">{job.location}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs uppercase text-muted">Applied</dt>
            <dd className="text-text">{formatDate(job.date_applied)}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-muted">Last activity</dt>
            <dd className="text-text">{formatDate(job.last_activity_at)}</dd>
          </div>
        </dl>

        <Link
          to={`/jobs/${job.id}`}
          onClick={onClose}
          className="mt-6 inline-block w-full rounded-xl bg-accent px-4 py-2 text-center text-sm font-medium text-white hover:bg-accent-hover"
        >
          Open full details
        </Link>
      </div>
    </div>
  );
}
