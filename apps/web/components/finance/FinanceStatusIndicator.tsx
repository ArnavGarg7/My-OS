"use client";

import { trpc } from "@/lib/trpc/client";

/**
 * Status-bar finance indicator (Sprint 2.11): "Finance · Budget 68% · Cash
 * Positive". Provider-driven via the summary query.
 */
export function FinanceStatusIndicator() {
  const summary = trpc.finance.summary.useQuery(undefined, { refetchInterval: 120_000 });
  const s = summary.data;
  if (!s) return null;

  const flowTone =
    s.cashFlow.direction === "positive"
      ? "bg-success"
      : s.cashFlow.direction === "negative"
        ? "bg-danger"
        : "bg-fg-subtle";

  return (
    <div className="flex items-center gap-1.5">
      <span aria-hidden className={`size-1.5 rounded-full ${flowTone}`} />
      <span className="text-fg-subtle">Finance</span>
      <span className="text-fg-muted font-medium">Budget {s.overallBudgetPercent}%</span>
      <span className="text-fg-muted capitalize">· {s.cashFlow.direction}</span>
    </div>
  );
}
