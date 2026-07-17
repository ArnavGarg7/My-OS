"use client";

import { trpc } from "@/lib/trpc/client";
import { ATTENTION_LABEL } from "./intelligence-icons";

/**
 * Status-bar dashboard indicator (Sprint 4.4): "Dashboard · 73 · 2 attention". Provider-driven
 * via intelligence.summary, which recomputes the whole executive rollup on each poll.
 */
export function IntelligenceStatusCard() {
  const summary = trpc.intelligence.summary.useQuery(undefined, { refetchInterval: 120_000 });
  const s = summary.data;
  if (!s) return null;
  const attention = s.needsAttention > 0;
  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${attention ? "bg-warning" : "bg-success"}`}
      />
      <span className="text-fg-subtle">Life</span>
      <span className="text-fg-muted font-medium">{s.overall}</span>
      <span className="text-fg-muted">· {ATTENTION_LABEL[s.overallLevel].toLowerCase()}</span>
      {s.needsAttention > 0 ? (
        <span className="text-warning">· {s.needsAttention} attention</span>
      ) : null}
      {s.reviewsDue > 0 ? <span className="text-fg-muted">· {s.reviewsDue} review due</span> : null}
    </div>
  );
}
