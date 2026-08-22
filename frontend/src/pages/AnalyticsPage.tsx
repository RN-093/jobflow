import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import * as analyticsApi from "@/api/analytics";
import * as pipelineApi from "@/api/pipeline";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ApplicationsOverTimeChart,
  AvgDaysPerStageChart,
  ByStageChart,
  BySourceChart,
  MonthlyBarChart,
} from "@/features/analytics/Charts";

function pct(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

export default function AnalyticsPage() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["analytics"],
    queryFn: analyticsApi.getAnalytics,
  });
  const { data: stages } = useQuery({ queryKey: ["stages"], queryFn: pipelineApi.listStages });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-56 w-full" />
        <Skeleton className="h-56 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState message="Couldn't load analytics." onRetry={() => refetch()} />;
  }

  const stageColors = Object.fromEntries((stages ?? []).map((s) => [s.name, s.color]));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-text">Analytics</h1>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
        <Card interactive>
          <p className="text-2xl font-semibold text-text">{pct(data.conversion_rates.app_to_interview_pct)}</p>
          <p className="text-xs text-muted">Application → Interview</p>
        </Card>
        <Card interactive>
          <p className="text-2xl font-semibold text-text">{pct(data.conversion_rates.interview_to_offer_pct)}</p>
          <p className="text-xs text-muted">Interview → Offer</p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Applications over time">
          <ApplicationsOverTimeChart data={data.applications_over_time} />
        </ChartCard>
        <ChartCard title="Applications by source">
          <BySourceChart data={data.by_source} />
        </ChartCard>
        <ChartCard title="Jobs by stage">
          <ByStageChart data={data.by_stage} stageColors={stageColors} />
        </ChartCard>
        <ChartCard title="Average time per stage">
          <AvgDaysPerStageChart data={data.avg_days_per_stage} stageColors={stageColors} />
        </ChartCard>
        <ChartCard title="Interviews per month">
          <MonthlyBarChart data={data.interviews_per_month} />
        </ChartCard>
        <ChartCard title="Offers per month">
          <MonthlyBarChart data={data.offers_per_month} color="rgb(var(--color-success))" />
        </ChartCard>
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="mb-2 text-sm font-semibold text-text">{title}</h2>
      {children}
    </Card>
  );
}
