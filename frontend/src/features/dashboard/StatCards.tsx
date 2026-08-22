import { Card } from "@/components/ui/Card";
import type { DashboardStats } from "@/types";

interface StatCardsProps {
  stats: DashboardStats;
}

const CARDS: { key: keyof DashboardStats; label: string }[] = [
  { key: "total_active", label: "Active" },
  { key: "interested", label: "Interested" },
  { key: "applied", label: "Applied" },
  { key: "interviews", label: "Interviewing" },
  { key: "offers", label: "Offers" },
  { key: "rejected", label: "Rejected" },
  { key: "withdrawn", label: "Withdrawn" },
];

export function StatCards({ stats }: StatCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {CARDS.map(({ key, label }) => (
        <Card key={key} interactive>
          <p className="text-2xl font-semibold text-text">{stats[key]}</p>
          <p className="text-xs text-muted">{label}</p>
        </Card>
      ))}
    </div>
  );
}
