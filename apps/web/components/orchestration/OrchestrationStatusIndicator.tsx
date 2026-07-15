"use client";

import { trpc } from "@/lib/trpc/client";

/**
 * Status-bar orchestration indicator (Sprint 3.5): "System · ready · 3 runs · 1
 * recovered". Provider-driven via orchestration.summary. Shows at a glance whether every
 * engine is cooperating cleanly.
 */
export function OrchestrationStatusIndicator() {
  const summary = trpc.orchestration.summary.useQuery(undefined, { refetchInterval: 60_000 });
  const s = summary.data;
  if (!s) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${s.systemReady ? "bg-success" : "bg-warning"}`}
      />
      <span className="text-fg-subtle">System</span>
      <span className="text-fg-muted font-medium">{s.systemReady ? "ready" : "attention"}</span>
      <span className="text-fg-muted">· {s.runsToday} runs</span>
      {s.recoveriesToday > 0 ? (
        <span className="text-warning">· {s.recoveriesToday} recovered</span>
      ) : null}
      {s.failuresToday > 0 ? <span className="text-danger">· {s.failuresToday} failed</span> : null}
    </div>
  );
}
