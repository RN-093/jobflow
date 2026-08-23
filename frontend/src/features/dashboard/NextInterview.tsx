import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

import { Card } from "@/components/ui/Card";
import { formatDateTime, formatRelative } from "@/lib/dates";
import type { UpcomingInterview } from "@/types";

interface NextInterviewProps {
  interviews: UpcomingInterview[];
}

export function NextInterview({ interviews }: NextInterviewProps) {
  const next = interviews[0];

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Next up</p>
      {!next ? (
        <Card padding="none" className="p-6 text-center">
          <p className="text-sm text-text">No interviews scheduled.</p>
          <p className="mt-1 text-sm text-muted">Keep applying, your next one will show up here.</p>
        </Card>
      ) : (
        <Card padding="none">
          <Link
            to={`/jobs/${next.job_id}`}
            className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="text-lg font-semibold text-text">{next.type_label}</p>
              <p className="truncate text-sm text-muted">
                {next.job_title} · {next.company}
              </p>
              <p className="mt-2 text-sm text-text">
                {formatDateTime(next.scheduled_at)} <span className="text-muted">· {formatRelative(next.scheduled_at)}</span>
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-accent">
              View interview <ArrowRight size={14} />
            </span>
          </Link>
          {interviews.length > 1 && (
            <p className="border-t border-border px-6 py-2 text-xs text-muted">+{interviews.length - 1} more upcoming</p>
          )}
        </Card>
      )}
    </div>
  );
}
