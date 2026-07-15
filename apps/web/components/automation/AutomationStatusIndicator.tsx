"use client";

import { trpc } from "@/lib/trpc/client";

/**
 * Status-bar automation indicator (Sprint 3.4): "Automation · 8 rules · 3 today · 1
 * failed". Replaces the earlier static placeholder. Provider-driven via
 * automation.summary.
 */
export function AutomationStatusIndicator() {
  const summary = trpc.automation.summary.useQuery(undefined, { refetchInterval: 60_000 });
  const s = summary.data;
  if (!s) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${s.failedToday > 0 ? "bg-danger" : "bg-success"}`}
      />
      <span className="text-fg-subtle">Automation</span>
      <span className="text-fg-muted font-medium">{s.enabledRules} rules</span>
      <span className="text-fg-muted">· {s.executedToday} today</span>
      {s.failedToday > 0 ? <span className="text-danger">· {s.failedToday} failed</span> : null}
    </div>
  );
}
