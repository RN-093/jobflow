import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { BarChart3, Calendar, Download, Kanban, LayoutDashboard, Moon, Settings, Table2 } from "lucide-react";

import * as jobsApi from "@/api/jobs";
import * as transferApi from "@/api/transfer";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { useDebouncedValue } from "@/hooks/useDebounce";
import { useTheme } from "@/hooks/useTheme";

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

const NAV_ACTIONS = [
  { label: "Go to Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Go to Board", to: "/board", icon: Kanban },
  { label: "Go to Jobs", to: "/jobs", icon: Table2 },
  { label: "Go to Calendar", to: "/calendar", icon: Calendar },
  { label: "Go to Analytics", to: "/analytics", icon: BarChart3 },
  { label: "Go to Settings", to: "/settings", icon: Settings },
];

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 300);
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { toast } = useToast();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const { data } = useQuery({
    queryKey: ["command-palette-jobs", debounced],
    queryFn: () => jobsApi.listJobs({ q: debounced, page_size: 6 }),
    enabled: open && debounced.length > 0,
  });

  const filteredNav = useMemo(
    () => NAV_ACTIONS.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
    [query]
  );

  function go(to: string): void {
    navigate(to);
    onClose();
  }

  async function handleExport(): Promise<void> {
    onClose();
    try {
      await transferApi.exportCsv();
      toast("CSV export started");
    } catch {
      toast("Export failed", "error");
    }
  }

  return (
    <Modal open={open} onClose={onClose} className="max-w-xl">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search jobs, jump to a page, or run an action..."
        className="mb-3 w-full rounded-xl border border-border bg-bg px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <div className="max-h-96 space-y-3 overflow-y-auto">
        {data?.items && data.items.length > 0 && (
          <div>
            <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted">Jobs</p>
            {data.items.map((job) => (
              <button
                key={job.id}
                onClick={() => go(`/jobs/${job.id}`)}
                className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-hover"
                type="button"
              >
                <span className="font-medium text-text">{job.title}</span>{" "}
                <span className="text-muted">at {job.company}</span>
              </button>
            ))}
          </div>
        )}

        <div>
          <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted">Navigate</p>
          {filteredNav.map(({ label, to, icon: Icon }) => (
            <button
              key={to}
              onClick={() => go(to)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text hover:bg-surface-hover"
              type="button"
            >
              <Icon size={15} className="text-muted" />
              {label}
            </button>
          ))}
        </div>

        <div>
          <p className="mb-1 px-1 text-xs font-semibold uppercase tracking-wide text-muted">Actions</p>
          <button
            onClick={() => {
              toggleTheme();
              onClose();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text hover:bg-surface-hover"
            type="button"
          >
            <Moon size={15} className="text-muted" />
            Toggle theme
          </button>
          <button
            onClick={handleExport}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text hover:bg-surface-hover"
            type="button"
          >
            <Download size={15} className="text-muted" />
            Export CSV
          </button>
        </div>
      </div>
    </Modal>
  );
}
