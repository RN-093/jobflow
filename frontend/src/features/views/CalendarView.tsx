import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { CalendarEvent } from "@/types";

interface CalendarViewProps {
  month: Date;
  events: CalendarEvent[];
  onMonthChange: (month: Date) => void;
}

const TYPE_CLASSES: Record<string, string> = {
  interview: "bg-accent/10 text-accent",
  deadline: "bg-danger/10 text-danger",
  follow_up: "bg-warning/10 text-warning",
  task: "bg-success/10 text-success",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function CalendarView({ month, events, onMonthChange }: CalendarViewProps) {
  const navigate = useNavigate();
  const start = startOfWeek(startOfMonth(month));
  const end = endOfWeek(endOfMonth(month));
  const days = eachDayOfInterval({ start, end });

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const event of events) {
    const list = eventsByDate.get(event.date) ?? [];
    list.push(event);
    eventsByDate.set(event.date, list);
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-text">{format(month, "MMMM yyyy")}</h2>
        <div className="flex gap-1">
          <Button variant="secondary" size="sm" onClick={() => onMonthChange(subMonths(month, 1))}>
            <ChevronLeft size={14} />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => onMonthChange(addMonths(month, 1))}>
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px overflow-hidden overflow-x-auto rounded-xl border border-border bg-border text-xs">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-surface-hover px-2 py-1 text-center font-medium text-muted">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate.get(key) ?? [];
          return (
            <div
              key={key}
              className={cn("min-h-[90px] bg-surface p-1.5 align-top", !isSameMonth(day, month) && "bg-bg text-muted")}
            >
              <p className={cn("mb-1 text-xs", isToday(day) && "font-bold text-accent")}>{format(day, "d")}</p>
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(`/jobs/${event.job_id}`)}
                    className={cn(
                      "block w-full truncate rounded px-1 py-0.5 text-left text-[10px]",
                      TYPE_CLASSES[event.type]
                    )}
                    type="button"
                  >
                    {event.label}
                  </button>
                ))}
                {dayEvents.length > 3 && <p className="text-[10px] text-muted">+{dayEvents.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
