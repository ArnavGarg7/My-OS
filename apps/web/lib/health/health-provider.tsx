"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

/**
 * Health hooks (Sprint 2.8.5). This does NOT build the Health domain — it only
 * exposes the seams so Sprint 2.9 plugs in: a `HealthProvider`, a `useHealth()`
 * summary hook, a status-bar slot and a Morning slot. Until 2.9 sets `available`
 * true, every slot renders nothing / a placeholder.
 */
export interface HealthSummary {
  /** Flipped true by Sprint 2.9 once the Health domain is live. */
  available: boolean;
  energy: "low" | "medium" | "high" | null;
  recoveryPercent: number | null;
  headline: string | null;
}

const PLACEHOLDER: HealthSummary = {
  available: false,
  energy: null,
  recoveryPercent: null,
  headline: null,
};

const HealthContext = createContext<HealthSummary | null>(null);

export function HealthProvider({
  value,
  children,
}: {
  value?: HealthSummary;
  children: ReactNode;
}) {
  const summary = useMemo<HealthSummary>(() => value ?? PLACEHOLDER, [value]);
  return <HealthContext.Provider value={summary}>{children}</HealthContext.Provider>;
}

export function useHealth(): HealthSummary {
  return useContext(HealthContext) ?? PLACEHOLDER;
}
