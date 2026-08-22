import { useQuery } from "@tanstack/react-query";

import * as analyticsApi from "@/api/analytics";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { MetricsGrid } from "@/features/dashboard/MetricsGrid";
import { RecentActivityFeed } from "@/features/dashboard/RecentActivityFeed";
import { StatCards } from "@/features/dashboard/StatCards";
import { UpcomingPanel } from "@/features/dashboard/UpcomingPanel";

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
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Dashboard</h1>
      <StatCards stats={data.stats} />
      <MetricsGrid metrics={data.metrics} />
      <UpcomingPanel upcoming={data.upcoming} />
      <div>
        <h2 className="mb-2 text-sm font-semibold text-text">Recent activity</h2>
        <RecentActivityFeed activities={data.recent_activity} />
      </div>
    </div>
  );
}
