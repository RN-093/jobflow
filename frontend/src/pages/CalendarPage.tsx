import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import * as analyticsApi from "@/api/analytics";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { CalendarView } from "@/features/views/CalendarView";

export default function CalendarPage() {
  const [month, setMonth] = useState(new Date());
  const year = month.getFullYear();
  const monthNum = month.getMonth() + 1;

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["calendar", `${year}-${monthNum}`],
    queryFn: () => analyticsApi.getCalendar(year, monthNum),
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold text-text">Calendar</h1>
      {isLoading ? (
        <Skeleton className="h-96 w-full" />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <CalendarView month={month} events={data ?? []} onMonthChange={setMonth} />
      )}
    </div>
  );
}
