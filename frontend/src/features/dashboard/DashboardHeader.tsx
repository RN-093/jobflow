import type { DashboardResponse } from "@/types";

interface DashboardHeaderProps {
  upcoming: DashboardResponse["upcoming"];
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function summaryLine(upcoming: DashboardResponse["upcoming"]): string {
  const interviewCount = upcoming.interviews.length;
  const overdueCount = upcoming.overdue_tasks.length;

  const interviewPart =
    interviewCount === 0
      ? "no interviews scheduled"
      : interviewCount === 1
        ? "1 interview coming up"
        : `${interviewCount} interviews coming up`;

  const overduePart = overdueCount === 0 ? "nothing overdue" : overdueCount === 1 ? "1 overdue task" : `${overdueCount} overdue tasks`;

  return `You have ${interviewPart} and ${overduePart}.`;
}

export function DashboardHeader({ upcoming }: DashboardHeaderProps) {
  return (
    <div>
      <h1 className="text-xl font-semibold text-text">Dashboard</h1>
      <p className="mt-1 text-sm text-muted">
        {greeting()}. {summaryLine(upcoming)}
      </p>
    </div>
  );
}
