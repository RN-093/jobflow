import { Card } from "@/components/ui/Card";
import type { DashboardMetrics } from "@/types";

interface PerformanceOverviewProps {
  metrics: DashboardMetrics;
}

function pct(value: number | null): string {
  return value === null ? "—" : `${value}%`;
}

function days(value: number | null): string {
  return value === null ? "—" : `${value} days`;
}

const monthLabel = new Date().toLocaleDateString(undefined, { month: "long" });

export function PerformanceOverview({ metrics }: PerformanceOverviewProps) {
  const conversions: { label: string; value: string }[] = [
    { label: "Application → interview", value: pct(metrics.app_to_interview_pct) },
    { label: "Interview → offer", value: pct(metrics.interview_to_offer_pct) },
    { label: "Time to first interview", value: days(metrics.avg_days_apply_to_first_interview) },
    { label: "Time to offer", value: days(metrics.avg_days_apply_to_offer) },
  ];

  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">This month</p>
      <Card>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-2xl font-semibold text-text">{metrics.applications_this_month}</p>
            <p className="text-xs text-muted">
              Applications · {monthLabel}
              {metrics.applications_this_week > 0 && (
                <span className="block text-muted/70">{metrics.applications_this_week} this week</span>
              )}
            </p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-text">{metrics.interviews_this_month}</p>
            <p className="text-xs text-muted">Interviews</p>
          </div>
          <div>
            <p className="text-2xl font-semibold text-text">{metrics.offers_received}</p>
            <p className="text-xs text-muted">Offers</p>
          </div>
        </div>

        <div className="mt-5 space-y-2 border-t border-border pt-4">
          {conversions.map((item) => (
            <div key={item.label} className="flex items-center justify-between text-sm">
              <span className="text-muted">{item.label}</span>
              <span className="font-medium text-text">{item.value}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
