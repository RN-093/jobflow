import { useCallback, useState } from "react";

const STORAGE_KEY = "jf-sidebar-collapsed";

function getStored(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function useSidebarCollapsed(): { collapsed: boolean; setCollapsed: (v: boolean) => void; toggle: () => void } {
  const [collapsed, setCollapsedState] = useState<boolean>(() => getStored());

  const setCollapsed = useCallback((value: boolean) => {
    localStorage.setItem(STORAGE_KEY, String(value));
    setCollapsedState(value);
  }, []);

  const toggle = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return { collapsed, setCollapsed, toggle };
}
