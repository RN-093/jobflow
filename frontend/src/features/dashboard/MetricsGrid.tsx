import { Card } from "@/components/ui/Card";
import type { DashboardMetrics } from "@/types";

interface MetricsGridProps {
  metrics: DashboardMetrics;
}

function pct(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

function days(value: number | null): string {
  return value === null ? "—" : `${value} days`;
}

export function MetricsGrid({ metrics }: MetricsGridProps) {
  const items: { label: string; value: string }[] = [
    { label: "Applications this week", value: String(metrics.applications_this_week) },
    { label: "Applications this month", value: String(metrics.applications_this_month) },
    { label: "Interviews this month", value: String(metrics.interviews_this_month) },
    { label: "Offers received", value: String(metrics.offers_received) },
    { label: "Application → Interview", value: pct(metrics.app_to_interview_pct) },
    { label: "Interview → Offer", value: pct(metrics.interview_to_offer_pct) },
    { label: "Avg. days to first interview", value: days(metrics.avg_days_apply_to_first_interview) },
    { label: "Avg. days to offer", value: days(metrics.avg_days_apply_to_offer) },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} interactive>
          <p className="text-lg font-semibold text-text">{item.value}</p>
          <p className="text-xs text-muted">{item.label}</p>
        </Card>
      ))}
    </div>
  );
}
