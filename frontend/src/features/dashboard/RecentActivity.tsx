import { Link } from "react-router-dom";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/dates";
import type { Activity, ActivityType } from "@/types";

interface RecentActivityProps {
  activities: Activity[];
}

const DOT_CLASSES: Partial<Record<ActivityType, string>> = {
  interview_created: "bg-accent",
  interview_completed: "bg-success",
  stage_changed: "bg-accent",
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Recent activity</p>
      {activities.length === 0 ? (
        <EmptyState title="No recent activity" />
      ) : (
        <Card padding="sm">
          <div className="space-y-0.5">
            {activities.map((activity) => {
              const dot = DOT_CLASSES[activity.type] ?? "bg-border";
              const content = (
                <>
                  <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", dot)} />
                  <div className="min-w-0">
                    <p className="truncate text-sm text-text">{activity.message}</p>
                    <p className="text-xs text-muted">{formatRelative(activity.created_at)}</p>
                  </div>
                </>
              );
              const rowClasses = "flex items-start gap-2 rounded-lg px-2 py-1.5";
              return activity.job_id ? (
                <Link key={activity.id} to={`/jobs/${activity.job_id}`} className={cn(rowClasses, "hover:bg-surface-hover")}>
                  {content}
                </Link>
              ) : (
                <div key={activity.id} className={rowClasses}>
                  {content}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
