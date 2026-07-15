"use client";

import { useMemo, type ReactNode } from "react";
import { HealthProvider, type HealthSummary as HealthSlotSummary } from "@/lib/health";
import { trpc } from "@/lib/trpc/client";

/**
 * HealthProviderBridge (Sprint 2.9). Fills the Sprint 2.8.5 `HealthProvider`
 * seam with real data from `health.summary`, flipping `available` true so the
 * Morning slot + status-bar slot go live. Mounted inside the data layer.
 */
export function HealthProviderBridge({ children }: { children: ReactNode }) {
  const summary = trpc.health.summary.useQuery({}, { staleTime: 60_000 });

  const value = useMemo<HealthSlotSummary>(() => {
    const s = summary.data;
    if (!s) {
      return { available: false, energy: null, recoveryPercent: null, headline: null };
    }
    const sleepText = s.sleep
      ? `${Math.floor(s.sleep.durationMinutes / 60)}h ${(s.sleep.durationMinutes % 60).toString().padStart(2, "0")}m`
      : "—";
    return {
      available: true,
      energy: s.energy.level,
      recoveryPercent: s.recovery.score,
      headline: `Slept ${sleepText} · ${s.recovery.status} · readiness ${s.readiness.score}%`,
    };
  }, [summary.data]);

  return <HealthProvider value={value}>{children}</HealthProvider>;
}
