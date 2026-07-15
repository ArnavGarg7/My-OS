"use client";

import { Text } from "@myos/ui";
import type { FocusSession, TimerState } from "@myos/core/focus";
import { ProgressRing } from "./ProgressRing";
import { formatClock } from "./format";
import { SESSION_TYPE_LABEL } from "./focus-icons";

/**
 * SessionTimer (Sprint 3.2). The large, distraction-free centrepiece — a circular
 * ring with the remaining (or elapsed-once-overrunning) time in the middle. Pure
 * display driven by the core TimerState.
 */
export function SessionTimer({ session, timer }: { session: FocusSession; timer: TimerState }) {
  const overrunning = timer.overrunMs > 0;
  const displayMs = overrunning ? timer.focusMs : timer.remainingMs;
  const tone = overrunning
    ? "warning"
    : session.status === "paused" || session.status === "break"
      ? "accent"
      : "success";

  return (
    <ProgressRing value={timer.progress} tone={tone}>
      <Text variant="caption" tone="subtle" className="uppercase tracking-wide">
        {SESSION_TYPE_LABEL[session.type]}
      </Text>
      <span
        className="font-mono text-5xl font-semibold tabular-nums sm:text-6xl"
        aria-live="polite"
      >
        {formatClock(displayMs)}
      </span>
      <Text variant="caption" tone="subtle">
        {overrunning ? "over plan" : `of ${session.plannedMinutes}m`}
      </Text>
    </ProgressRing>
  );
}
