"use client";

import { trpc } from "@/lib/trpc/client";
import { formatMinutes, readinessTone } from "./health-icons";

const DOT: Record<"success" | "warning" | "danger", string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
};

/**
 * Status-bar health indicator (Sprint 2.9): "Health · Readiness 84 · Water
 * 2.4/3L · Sleep 7h48m". Provider-driven via the summary query.
 */
export function HealthStatusIndicator() {
  const summary = trpc.health.summary.useQuery({}, { refetchInterval: 60_000 });
  const s = summary.data;
  if (!s) return null;
  const tone = readinessTone(s.readiness.score);

  return (
    <div className="flex items-center gap-1.5">
      <span aria-hidden className={`size-1.5 rounded-full ${DOT[tone]}`} />
      <span className="text-fg-subtle">Health</span>
      <span className="text-fg-muted font-medium">Readiness {s.readiness.score}</span>
      <span className="text-fg-muted">
        · Water {(s.hydration.totalMl / 1000).toFixed(1)}/{(s.hydration.goalMl / 1000).toFixed(1)}L
      </span>
      {s.sleep ? (
        <span className="text-fg-muted">· Sleep {formatMinutes(s.sleep.durationMinutes)}</span>
      ) : null}
    </div>
  );
}
