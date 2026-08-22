import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import * as notificationsApi from "@/api/notifications";

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: notificationsApi.listNotifications,
    refetchInterval: 60_000,
  });

  const markRead = useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) => notificationsApi.markNotificationRead(id, read),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const unreadCount = (query.data ?? []).filter((n) => !n.read).length;

  return { ...query, unreadCount, markRead };
}
