import {
  Archive,
  ArrowRightCircle,
  Briefcase,
  CalendarCheck,
  CalendarPlus,
  CheckCircle2,
  FileText,
  MessageSquarePlus,
  RefreshCw,
  RotateCcw,
  UserMinus,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { useTimeline } from "@/hooks/useJob";
import { formatDateTime } from "@/lib/dates";
import type { ActivityType } from "@/types";

interface TimelineTabProps {
  jobId: string;
}

const ICONS: Record<ActivityType, LucideIcon> = {
  job_created: Briefcase,
  job_edited: FileText,
  stage_changed: ArrowRightCircle,
  interview_created: CalendarPlus,
  interview_completed: CalendarCheck,
  note_added: MessageSquarePlus,
  contact_added: UserPlus,
  contact_removed: UserMinus,
  task_created: CheckCircle2,
  task_completed: CheckCircle2,
  job_archived: Archive,
  job_restored: RotateCcw,
  source_added: RefreshCw,
};

export function TimelineTab({ jobId }: TimelineTabProps) {
  const { data, isLoading, isError, refetch } = useTimeline(jobId);

  if (isLoading) return <Skeleton className="h-64 w-full" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (!data || data.length === 0) return <EmptyState title="No activity yet" />;

  return (
    <ol className="space-y-4">
      {data.map((activity) => {
        const Icon = ICONS[activity.type] ?? FileText;
        return (
          <li key={activity.id} className="flex gap-3">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
              <Icon size={14} />
            </div>
            <div>
              <p className="text-sm text-text">{activity.message}</p>
              <p className="text-xs text-muted">{formatDateTime(activity.created_at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
