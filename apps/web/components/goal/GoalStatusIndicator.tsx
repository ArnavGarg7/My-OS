"use client";

import { trpc } from "@/lib/trpc/client";

/**
 * Status-bar goal indicator (Sprint 2.12): "Goals · 3 Active · 74% · 7-day
 * Habit Streak". Provider-driven via the portfolio query.
 */
export function GoalStatusIndicator() {
  const portfolio = trpc.goal.portfolio.useQuery(undefined, { refetchInterval: 120_000 });
  const p = portfolio.data;
  if (!p || p.activeCount === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <span
        aria-hidden
        className={`size-1.5 rounded-full ${p.behindCount > 0 ? "bg-warning" : "bg-success"}`}
      />
      <span className="text-fg-subtle">Goals</span>
      <span className="text-fg-muted font-medium">{p.activeCount} Active</span>
      <span className="text-fg-muted">· {p.overallProgress}%</span>
      {p.habitStreak > 0 ? (
        <span className="text-fg-muted">· {p.habitStreak}-day streak</span>
      ) : null}
    </div>
  );
}
