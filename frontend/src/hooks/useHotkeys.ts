import { useEffect, useRef } from "react";

type HotkeyHandler = () => void;
export interface HotkeyMap {
  [key: string]: HotkeyHandler;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

export function useHotkeys(map: HotkeyMap): void {
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    let pendingPrefix: string | null = null;
    let prefixTimeout: ReturnType<typeof setTimeout> | null = null;

    function handleKeyDown(event: KeyboardEvent): void {
      if (isTypingTarget(event.target)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const key = event.key.toLowerCase();
      const handlers = mapRef.current;

      if (pendingPrefix) {
        const combo = `${pendingPrefix} ${key}`;
        if (handlers[combo]) {
          event.preventDefault();
          handlers[combo]();
        }
        pendingPrefix = null;
        if (prefixTimeout) clearTimeout(prefixTimeout);
        return;
      }

      if (key === "g" && Object.keys(handlers).some((k) => k.startsWith("g "))) {
        pendingPrefix = "g";
        prefixTimeout = setTimeout(() => {
          pendingPrefix = null;
        }, 1000);
        return;
      }

      if (handlers[key]) {
        event.preventDefault();
        handlers[key]();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (prefixTimeout) clearTimeout(prefixTimeout);
    };
  }, []);
}
