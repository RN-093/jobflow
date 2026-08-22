import { createContext, useContext, useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { CommandPalette } from "@/components/command/CommandPalette";
import { ShortcutsDialog } from "@/components/command/ShortcutsDialog";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { NewJobModal } from "@/features/jobs/NewJobModal";
import { useHotkeys } from "@/hooks/useHotkeys";
import { useSidebarCollapsed } from "@/hooks/useSidebarCollapsed";

interface NewJobModalContextValue {
  open: () => void;
}

const NewJobModalContext = createContext<NewJobModalContextValue | undefined>(undefined);

export function useNewJobModal(): NewJobModalContextValue {
  const ctx = useContext(NewJobModalContext);
  if (!ctx) throw new Error("useNewJobModal must be used within AppLayout");
  return ctx;
}

export function AppLayout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newJobOpen, setNewJobOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { collapsed, toggle: toggleCollapsed } = useSidebarCollapsed();

  useHotkeys({
    n: () => setNewJobOpen(true),
    "/": () => setPaletteOpen(true),
    "?": () => setShortcutsOpen(true),
    escape: () => {
      setNewJobOpen(false);
      setPaletteOpen(false);
      setShortcutsOpen(false);
    },
    "g d": () => navigate("/dashboard"),
    "g p": () => navigate("/board"),
    "g j": () => navigate("/jobs"),
    "g c": () => navigate("/calendar"),
    "g a": () => navigate("/analytics"),
  });

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <NewJobModalContext.Provider value={{ open: () => setNewJobOpen(true) }}>
      <div className="flex h-screen overflow-hidden bg-bg">
        <Sidebar
          mobileOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            onOpenSidebar={() => setSidebarOpen(true)}
            onNewJob={() => setNewJobOpen(true)}
            onOpenPalette={() => setPaletteOpen(true)}
          />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
      <NewJobModal open={newJobOpen} onClose={() => setNewJobOpen(false)} />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <ShortcutsDialog open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </NewJobModalContext.Provider>
  );
}
