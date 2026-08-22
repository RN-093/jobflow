import { differenceInCalendarDays, format, formatDistanceToNow, parseISO } from "date-fns";

export function formatDate(value: string | null | undefined, pattern = "MMM d, yyyy"): string {
  if (!value) return "—";
  return format(parseISO(value), pattern);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return format(parseISO(value), "MMM d, yyyy 'at' h:mm a");
}

export function formatRelative(value: string | null | undefined): string {
  if (!value) return "—";
  return formatDistanceToNow(parseISO(value), { addSuffix: true });
}

export function daysSince(value: string): number {
  return differenceInCalendarDays(new Date(), parseISO(value));
}

export function activityDotColor(lastActivityAt: string): "green" | "amber" | "red" {
  const days = daysSince(lastActivityAt);
  if (days < 7) return "green";
  if (days < 14) return "amber";
  return "red";
}

export function isOverdue(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  return differenceInCalendarDays(parseISO(dateStr), new Date()) < 0;
}

export function toDateInputValue(value: string | null | undefined): string {
  if (!value) return "";
  return value.slice(0, 10);
}
