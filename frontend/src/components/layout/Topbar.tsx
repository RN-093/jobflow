import { Menu, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

interface TopbarProps {
  onOpenSidebar: () => void;
  onNewJob: () => void;
  onOpenPalette: () => void;
}

export function Topbar({ onOpenSidebar, onNewJob, onOpenPalette }: TopbarProps) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
      <button
        onClick={onOpenSidebar}
        className="rounded-lg p-2 text-muted hover:bg-surface-hover md:hidden"
        aria-label="Open menu"
        type="button"
      >
        <Menu size={20} />
      </button>

      <button
        onClick={onOpenPalette}
        className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-bg px-3 py-1.5 text-sm text-muted hover:bg-surface-hover sm:max-w-xs"
        type="button"
      >
        <Search size={15} />
        <span className="hidden sm:inline">Search jobs...</span>
        <span className="ml-auto hidden rounded border border-border px-1.5 py-0.5 text-xs sm:inline">⌘K</span>
      </button>

      <div className="ml-auto flex items-center gap-1">
        <Button size="sm" onClick={onNewJob} className="hidden sm:inline-flex">
          <Plus size={16} />
          New job
        </Button>
        <button
          onClick={onNewJob}
          className="rounded-lg p-2 text-muted hover:bg-surface-hover sm:hidden"
          aria-label="New job"
          type="button"
        >
          <Plus size={18} />
        </button>
        <NotificationBell />
        <ThemeToggle />
      </div>
    </header>
  );
}
