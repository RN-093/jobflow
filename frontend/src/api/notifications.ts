import { api } from "@/api/client";
import type { Notification } from "@/types";

export function listNotifications(): Promise<Notification[]> {
  return api.get<Notification[]>("/notifications");
}

export function markNotificationRead(id: string, read: boolean): Promise<Notification> {
  return api.patch<Notification>(`/notifications/${id}`, { read });
}
