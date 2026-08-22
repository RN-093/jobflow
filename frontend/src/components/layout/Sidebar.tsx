import { BarChart3, Calendar, Kanban, LayoutDashboard, Settings, Table2, X } from "lucide-react";
import { NavLink } from "react-router-dom";

import { cn } from "@/lib/cn";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/board", label: "Board", icon: Kanban },
  { to: "/jobs", label: "Jobs", icon: Table2 },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const content = (
    <nav className="flex h-full flex-col gap-1 p-3">
      <div className="mb-4 flex items-center gap-2 px-2 py-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
          JF
        </div>
        <span className="text-lg font-semibold text-text lg:inline">JobFlow</span>
      </div>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onCloseMobile}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              isActive ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface-hover hover:text-text"
            )
          }
        >
          <Icon size={18} className="shrink-0" />
          <span className="lg:inline">{label}</span>
        </NavLink>
      ))}
    </nav>
  );

  return (
    <>
      <aside className="hidden shrink-0 border-r border-border bg-surface md:flex md:w-56 lg:w-60">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onCloseMobile} />
          <aside className="relative z-50 w-64 border-r border-border bg-surface shadow-xl">
            <button
              onClick={onCloseMobile}
              className="absolute right-3 top-3 rounded-lg p-1 text-muted hover:bg-surface-hover"
              aria-label="Close menu"
              type="button"
            >
              <X size={18} />
            </button>
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
