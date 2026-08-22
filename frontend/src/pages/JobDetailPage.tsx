import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ContactsTab } from "@/features/jobs/tabs/ContactsTab";
import { InterviewsTab } from "@/features/jobs/tabs/InterviewsTab";
import { NotesTab } from "@/features/jobs/tabs/NotesTab";
import { OverviewTab } from "@/features/jobs/tabs/OverviewTab";
import { PipelineTab } from "@/features/jobs/tabs/PipelineTab";
import { TasksTab } from "@/features/jobs/tabs/TasksTab";
import { TimelineTab } from "@/features/jobs/tabs/TimelineTab";
import { useJob } from "@/hooks/useJob";
import { cn } from "@/lib/cn";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "pipeline", label: "Pipeline" },
  { key: "timeline", label: "Timeline" },
  { key: "interviews", label: "Interviews" },
  { key: "contacts", label: "Contacts" },
  { key: "tasks", label: "Tasks" },
  { key: "notes", label: "Notes" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<TabKey>("overview");
  const { data: job, isLoading, isError, refetch } = useJob(id);

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (isError || !job) {
    return <ErrorState message="Couldn't load this job." onRetry={() => refetch()} />;
  }

  return (
    <div>
      <Link to="/board" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-text">
        <ArrowLeft size={14} /> Back to board
      </Link>

      <div className="mb-4">
        <h1 className="text-xl font-semibold text-text">{job.title}</h1>
        <p className="text-sm text-muted">
          {job.company} · {job.stage_name}
        </p>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium",
              tab === t.key ? "border-accent text-accent" : "border-transparent text-muted hover:text-text"
            )}
            type="button"
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab job={job} />}
      {tab === "pipeline" && <PipelineTab job={job} />}
      {tab === "timeline" && <TimelineTab jobId={job.id} />}
      {tab === "interviews" && <InterviewsTab jobId={job.id} />}
      {tab === "contacts" && <ContactsTab jobId={job.id} />}
      {tab === "tasks" && <TasksTab jobId={job.id} />}
      {tab === "notes" && <NotesTab jobId={job.id} />}
    </div>
  );
}
