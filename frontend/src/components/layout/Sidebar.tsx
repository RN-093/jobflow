import type { ReactNode } from "react";
import {
  BarChart3,
  Calendar,
  ChevronsLeft,
  ChevronsRight,
  Kanban,
  LayoutDashboard,
  LogOut,
  Settings,
  Table2,
  X,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";
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
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile, collapsed, onToggleCollapsed }: SidebarProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout(): void {
    logout();
    navigate("/login");
  }

  function renderContent(isCollapsed: boolean, options: { showCollapseToggle: boolean }): ReactNode {
    return (
      <nav className="flex h-full flex-col gap-1 p-3">
        <div className={cn("mb-4 flex items-center gap-2 px-2 py-2", isCollapsed && "justify-center px-0")}>
          <div
            data-app-logo
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white"
          >
            JF
          </div>
          {!isCollapsed && <span className="text-lg font-semibold text-text">JobFlow</span>}
        </div>

        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onCloseMobile}
            title={isCollapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                isCollapsed && "justify-center px-0",
                isActive ? "bg-accent/10 text-accent" : "text-muted hover:bg-surface-hover hover:text-text"
              )
            }
          >
            <Icon size={18} className="shrink-0" />
            {!isCollapsed && <span>{label}</span>}
          </NavLink>
        ))}

        <div className="mt-auto flex flex-col gap-1 border-t border-border pt-2">
          {options.showCollapseToggle && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-hover hover:text-text",
                isCollapsed && "justify-center px-0"
              )}
            >
              {isCollapsed ? <ChevronsRight size={18} className="shrink-0" /> : <ChevronsLeft size={18} className="shrink-0" />}
              {!isCollapsed && <span>Collapse</span>}
            </button>
          )}
          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? "Log out" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-danger/10 hover:text-danger",
              isCollapsed && "justify-center px-0"
            )}
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && <span>Log out</span>}
          </button>
        </div>
      </nav>
    );
  }

  return (
    <>
      <aside
        className={cn(
          "hidden shrink-0 border-r border-border bg-surface transition-[width] duration-200 md:flex",
          collapsed ? "md:w-16" : "md:w-56 lg:w-60"
        )}
      >
        {renderContent(collapsed, { showCollapseToggle: true })}
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
            {renderContent(false, { showCollapseToggle: false })}
          </aside>
        </div>
      )}
    </>
  );
}
