import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatDateTime } from "@/lib/dates";
import type { DashboardResponse } from "@/types";

interface UpcomingPanelProps {
  upcoming: DashboardResponse["upcoming"];
}

export function UpcomingPanel({ upcoming }: UpcomingPanelProps) {
  const hasAnything =
    upcoming.interviews.length > 0 ||
    upcoming.overdue_tasks.length > 0 ||
    upcoming.tasks_today.length > 0 ||
    upcoming.attention.length > 0;

  if (!hasAnything) {
    return <EmptyState title="Nothing needs your attention right now" />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Section title="Upcoming interviews">
        {upcoming.interviews.length === 0 ? (
          <p className="text-sm text-muted">No interviews scheduled.</p>
        ) : (
          upcoming.interviews.map((i) => (
            <Row key={i.id} to={`/jobs/${i.job_id}`} primary={`${i.type_label} — ${i.company}`} secondary={formatDateTime(i.scheduled_at)} />
          ))
        )}
      </Section>

      <Section title="Overdue tasks">
        {upcoming.overdue_tasks.length === 0 ? (
          <p className="text-sm text-muted">Nothing overdue.</p>
        ) : (
          upcoming.overdue_tasks.map((t) => (
            <Row key={t.id} to={`/jobs/${t.job_id}`} primary={t.title} secondary={`${t.company} · due ${formatDate(t.due_date)}`} danger />
          ))
        )}
      </Section>

      <Section title="Due today">
        {upcoming.tasks_today.length === 0 ? (
          <p className="text-sm text-muted">Nothing due today.</p>
        ) : (
          upcoming.tasks_today.map((t) => (
            <Row key={t.id} to={`/jobs/${t.job_id}`} primary={t.title} secondary={t.company} />
          ))
        )}
      </Section>

      <Section title="Needs attention">
        {upcoming.attention.length === 0 ? (
          <p className="text-sm text-muted">Everything's fresh.</p>
        ) : (
          upcoming.attention.map((j) => (
            <Row key={j.id} to={`/jobs/${j.id}`} primary={`${j.title} — ${j.company}`} secondary={j.stage_name} />
          ))
        )}
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-text">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ to, primary, secondary, danger }: { to: string; primary: string; secondary: string; danger?: boolean }) {
  return (
    <Link to={to} className="block rounded-lg px-2 py-1.5 hover:bg-surface-hover">
      <p className={`text-sm ${danger ? "text-danger" : "text-text"}`}>{primary}</p>
      <p className="text-xs text-muted">{secondary}</p>
    </Link>
  );
}
