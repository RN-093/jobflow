import { useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useNotifications } from "@/hooks/useNotifications";
import { formatRelative } from "@/lib/dates";
import { cn } from "@/lib/cn";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { data: notifications, unreadCount, markRead } = useNotifications();
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-2 text-muted hover:bg-surface-hover hover:text-text"
        aria-label="Notifications"
        type="button"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-danger" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-border bg-surface p-2 shadow-xl">
            <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted">Notifications</div>
            {!notifications || notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted">You're all caught up.</p>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.read) markRead.mutate({ id: n.id, read: true });
                      setOpen(false);
                      if (n.job_id) navigate(`/jobs/${n.job_id}`);
                    }}
                    className={cn(
                      "block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-hover",
                      !n.read && "bg-accent/5"
                    )}
                    type="button"
                  >
                    <p className={cn("text-text", !n.read && "font-medium")}>{n.message}</p>
                    <p className="mt-0.5 text-xs text-muted">{formatRelative(n.created_at)}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
