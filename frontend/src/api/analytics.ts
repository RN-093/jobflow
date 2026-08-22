import { api } from "@/api/client";
import type { AnalyticsResponse, CalendarEvent, DashboardResponse } from "@/types";

export function getDashboard(): Promise<DashboardResponse> {
  return api.get<DashboardResponse>("/dashboard");
}

export function getAnalytics(): Promise<AnalyticsResponse> {
  return api.get<AnalyticsResponse>("/analytics");
}

export function getCalendar(year: number, month: number): Promise<CalendarEvent[]> {
  return api.get<CalendarEvent[]>(`/calendar?year=${year}&month=${month}`);
}
