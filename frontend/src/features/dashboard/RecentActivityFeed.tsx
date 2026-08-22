import { Link } from "react-router-dom";

import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelative } from "@/lib/dates";
import type { Activity } from "@/types";

interface RecentActivityFeedProps {
  activities: Activity[];
}

export function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  if (activities.length === 0) {
    return <EmptyState title="No recent activity" />;
  }

  return (
    <div className="space-y-1">
      {activities.map((activity) =>
        activity.job_id ? (
          <Link
            key={activity.id}
            to={`/jobs/${activity.job_id}`}
            className="block rounded-lg px-2 py-1.5 hover:bg-surface-hover"
          >
            <p className="text-sm text-text">{activity.message}</p>
            <p className="text-xs text-muted">{formatRelative(activity.created_at)}</p>
          </Link>
        ) : (
          <div key={activity.id} className="px-2 py-1.5">
            <p className="text-sm text-text">{activity.message}</p>
            <p className="text-xs text-muted">{formatRelative(activity.created_at)}</p>
          </div>
        )
      )}
    </div>
  );
}
