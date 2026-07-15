"use client";

import { AlertTriangle, CheckCircle2, Info, Lock, Sunrise } from "lucide-react";
import { Button, StatBlock, Text } from "@myos/ui";
import type { TomorrowRecommendation } from "@myos/core/tomorrow";
import type { TomorrowStudioState } from "@myos/core/tomorrow";

const TONE_ICON = { success: CheckCircle2, warning: AlertTriangle, info: Info } as const;
const TONE_CLASS = {
  success: "text-success",
  warning: "text-warning",
  info: "text-fg-subtle",
} as const;

/**
 * TomorrowSummary (Sprint 3.1). Step 8 — the finalize view. Shows the plan at a
 * glance, deterministic recommendations, and the finalise / lock actions.
 */
export function TomorrowSummary({
  state,
  canFinalize,
  onFinalize,
  onLock,
  pending,
  locked,
}: {
  state: TomorrowStudioState;
  canFinalize: boolean;
  onFinalize: () => void;
  onLock: () => void;
  pending?: boolean;
  locked?: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatBlock label="Priorities" value={String(state.priorities.top.length)} />
        <StatBlock label="Carrying" value={String(state.carryForward.total)} />
        <StatBlock label="Readiness" value={String(state.readiness.score)} />
        <StatBlock label="Checklist" value={`${state.checklist.percent}%`} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Text variant="label" tone="subtle">
          Tonight's recommendations
        </Text>
        <ul className="flex flex-col gap-1.5">
          {state.recommendations.map((r: TomorrowRecommendation) => {
            const Icon = TONE_ICON[r.tone];
            return (
              <li key={r.id} className="flex items-start gap-2">
                <Icon size={14} aria-hidden className={`${TONE_CLASS[r.tone]} mt-0.5 shrink-0`} />
                <div className="min-w-0">
                  <Text variant="body-s">{r.title}</Text>
                  <Text variant="caption" tone="subtle">
                    {r.detail}
                  </Text>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onFinalize} disabled={!canFinalize || locked} loading={pending ?? false}>
          <Sunrise size={14} aria-hidden />
          Finalize tomorrow
        </Button>
        <Button variant="secondary" onClick={onLock} disabled={!state.ready}>
          <Lock size={14} aria-hidden />
          Lock plan
        </Button>
      </div>
      {!canFinalize ? (
        <Text variant="caption" tone="subtle">
          Choose priorities and complete the required checklist items to finalise.
        </Text>
      ) : null}
    </div>
  );
}
