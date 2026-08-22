import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

interface LoginTransitionContextValue {
  play: () => void;
}

const LoginTransitionContext = createContext<LoginTransitionContextValue | undefined>(undefined);

export function useLoginTransition(): LoginTransitionContextValue {
  const ctx = useContext(LoginTransitionContext);
  if (!ctx) throw new Error("useLoginTransition must be used within LoginTransitionProvider");
  return ctx;
}

// Sizes/position mirror the real logo marks: AuthLayout's centered h-10 w-10 block growing
// to cover the screen, then settling into Sidebar's h-8 w-8 block near the top-left. These are
// fixed approximations, not measured via getBoundingClientRect — intentionally simple/robust.
const LOGO_SIZE = 40;
const TARGET_SIZE = 32;
const TARGET_X = 28;
const TARGET_Y = 28;

type Phase = "center" | "cover" | "settle";

export function LoginTransitionProvider({ children }: { children: ReactNode }) {
  const [playing, setPlaying] = useState(false);
  const [phase, setPhase] = useState<Phase>("center");
  const startedRef = useRef(false);

  const play = useCallback(() => setPlaying(true), []);

  useEffect(() => {
    if (!playing) {
      startedRef.current = false;
      return;
    }
    // Guards against React.StrictMode's dev-only double-invoke restarting the animation mid-flight.
    if (startedRef.current) return;
    startedRef.current = true;

    setPhase("center");
    const t1 = setTimeout(() => setPhase("cover"), 30);
    const t2 = setTimeout(() => setPhase("settle"), 350);
    const t3 = setTimeout(() => setPlaying(false), 900);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [playing]);

  return (
    <LoginTransitionContext.Provider value={{ play }}>
      {children}
      {playing && <LoginTransitionOverlay phase={phase} />}
    </LoginTransitionContext.Provider>
  );
}

function LoginTransitionOverlay({ phase }: { phase: Phase }) {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1280;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const centerX = vw / 2 - LOGO_SIZE / 2;
  const centerY = vh / 2 - LOGO_SIZE / 2;
  const coverScale = (Math.max(vw, vh) * 1.6) / LOGO_SIZE;

  const transforms: Record<Phase, string> = {
    center: `translate(${centerX}px, ${centerY}px) scale(1)`,
    cover: `translate(${centerX}px, ${centerY}px) scale(${coverScale})`,
    settle: `translate(${TARGET_X}px, ${TARGET_Y}px) scale(${TARGET_SIZE / LOGO_SIZE})`,
  };
  const durations: Record<Phase, string> = { center: "0ms", cover: "320ms", settle: "420ms" };

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]" aria-hidden="true">
      <div
        className="absolute left-0 top-0 flex items-center justify-center rounded-lg bg-accent text-sm font-bold text-white shadow-2xl"
        style={{
          width: LOGO_SIZE,
          height: LOGO_SIZE,
          transform: transforms[phase],
          transformOrigin: "top left",
          opacity: phase === "settle" ? 0 : 1,
          transition: `transform ${durations[phase]} ease-in-out, opacity 250ms ease-in ${
            phase === "settle" ? "150ms" : "0ms"
          }`,
        }}
      >
        <span style={{ opacity: phase === "center" ? 1 : 0, transition: "opacity 120ms" }}>JF</span>
      </div>
    </div>
  );
}
