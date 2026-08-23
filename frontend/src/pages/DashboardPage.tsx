import { useQuery } from "@tanstack/react-query";

import * as analyticsApi from "@/api/analytics";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { DashboardHeader } from "@/features/dashboard/DashboardHeader";
import { NextInterview } from "@/features/dashboard/NextInterview";
import { PerformanceOverview } from "@/features/dashboard/PerformanceOverview";
import { RecentActivity } from "@/features/dashboard/RecentActivity";
import { SearchPipeline } from "@/features/dashboard/SearchPipeline";
import { TasksSummary } from "@/features/dashboard/TasksSummary";

export default function DashboardPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: analyticsApi.getDashboard,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState message="Couldn't load your dashboard." onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-8">
      <DashboardHeader upcoming={data.upcoming} />
      <SearchPipeline stats={data.stats} />
      <NextInterview interviews={data.upcoming.interviews} />
      <div className="grid gap-8 sm:grid-cols-2">
        <RecentActivity activities={data.recent_activity} />
        <PerformanceOverview metrics={data.metrics} />
      </div>
      <TasksSummary upcoming={data.upcoming} />
    </div>
  );
}
