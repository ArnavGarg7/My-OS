"use client";

import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";
import { AnalyticsEmitter } from "./emitter";
import type { MetricEvent, MetricInput, MetricKind } from "./types";

/**
 * AnalyticsProvider (Sprint 2.8.5). Holds one process-wide `AnalyticsEmitter`
 * and exposes `useAnalytics()`. Engines call `track(...)` from their mutation
 * success handlers; Sprint 2.14 reads the aggregates.
 */
export interface AnalyticsValue {
  track: (input: MetricInput) => MetricEvent;
  count: (kind: MetricKind) => number;
  average: (kind: MetricKind) => number;
  recent: (limit?: number) => MetricEvent[];
  subscribe: (fn: (event: MetricEvent) => void) => () => void;
}

const AnalyticsContext = createContext<AnalyticsValue | null>(null);

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const ref = useRef<AnalyticsEmitter | null>(null);
  if (!ref.current) ref.current = new AnalyticsEmitter();
  const emitter = ref.current;

  const value = useMemo<AnalyticsValue>(
    () => ({
      track: (input) => emitter.track(input),
      count: (kind) => emitter.count(kind),
      average: (kind) => emitter.average(kind),
      recent: (limit) => emitter.recent(limit),
      subscribe: (fn) => emitter.subscribe(fn),
    }),
    [emitter],
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics(): AnalyticsValue {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) throw new Error("useAnalytics must be used within <AnalyticsProvider>");
  return ctx;
}

/** No-throw variant for engine hooks that may render outside the provider. */
export function useOptionalAnalytics(): Pick<AnalyticsValue, "track"> {
  const ctx = useContext(AnalyticsContext);
  return ctx ?? { track: () => ({ id: "", kind: "task.completed", value: 0, at: "" }) };
}
