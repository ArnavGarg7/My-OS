import { DEFAULT_WORKING_HOURS, type WorkingHours } from "./constants";
import { calculateEnergyTrend } from "./planner";
import type { DailyFocus, DailyMetrics, DailyState, TodaySnapshot } from "./types";

/**
 * Today selectors (Sprint 2.1). Pure derivations of view-ready data from domain
 * state. No IO, no formatting concerns — components format for display.
 */

/** Resolve the working-hours window from state (wake/sleep) then preferences. */
export function selectWorkingHours(params: {
  state?: Pick<DailyState, "wakeTime" | "sleepTarget"> | null;
  preferredStartOfDay?: string | null;
  preferredEndOfDay?: string | null;
}): WorkingHours {
  const start = params.state?.wakeTime ?? params.preferredStartOfDay ?? DEFAULT_WORKING_HOURS.start;
  const end = params.state?.sleepTarget ?? params.preferredEndOfDay ?? DEFAULT_WORKING_HOURS.end;
  return { start, end };
}

/** The single line the shell surfaces as "current focus". */
export function selectCurrentFocusLabel(
  focus: Pick<DailyFocus, "mission" | "priority"> | null,
  state: Pick<DailyState, "currentActivity"> | null,
): string | null {
  return (
    state?.currentActivity?.trim() || focus?.mission?.trim() || focus?.priority?.trim() || null
  );
}

/** The view model for the Today context panel. */
export function selectContextPanel(params: {
  snapshot: TodaySnapshot;
  metrics?: Pick<DailyMetrics, "deepWorkMinutes"> | null;
}) {
  return {
    remainingMinutes: params.snapshot.remainingDay.remainingMinutes,
    focusWindow: params.snapshot.productiveWindow,
    deepWorkMinutes: params.metrics?.deepWorkMinutes ?? 0,
    nextCheckpoint: params.snapshot.nextCheckpoint,
    phase: params.snapshot.phase,
  };
}

/** Whether the day has meaningfully begun (any focus/state set). */
export function selectHasDayStarted(state: DailyState | null, focus: DailyFocus | null): boolean {
  if (!state && !focus) return false;
  return Boolean(
    state?.wakeTime ||
    state?.energyLevel ||
    state?.currentActivity ||
    state?.morningCompleted ||
    focus?.mission ||
    focus?.priority,
  );
}

/** A compact summary used by the dashboard header. */
export function selectDaySummary(params: {
  state: DailyState | null;
  metrics: DailyMetrics | null;
}) {
  const energyTrend = calculateEnergyTrend(params.metrics?.energyEntries ?? []);
  return {
    status: params.state?.status ?? "idle",
    energyLevel: params.state?.energyLevel ?? null,
    focusScore: params.state?.focusScore ?? null,
    energyTrend,
    deepWorkMinutes: params.metrics?.deepWorkMinutes ?? 0,
  };
}
