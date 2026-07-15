"use client";

import { useEffect, useState } from "react";

/**
 * Current-time indicator (Sprint 2.6). A thin live "now" label shown above the
 * timeline. Updates every 30s.
 */
export function PlannerNowIndicator() {
  const [now, setNow] = useState<string | null>(null);
  useEffect(() => {
    const tick = () =>
      setNow(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 px-1 py-1" aria-label="Current time">
      <span aria-hidden className="bg-accent size-2 rounded-full" />
      <span className="text-caption text-accent font-medium tabular-nums" suppressHydrationWarning>
        Now · {now ?? "--:--"}
      </span>
      <span aria-hidden className="bg-accent/40 h-px flex-1" />
    </div>
  );
}
