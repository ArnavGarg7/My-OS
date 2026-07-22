/**
 * Context Windows (Sprint 6.1). Signals exist inside a time horizon (spec §Context Windows). The
 * generator/detectors set a window; these helpers classify by an explicit target time and filter a
 * feed by window. Pure — `now` is passed in.
 */
import type { ContextWindow, Signal } from "./types";

/** Classify a target instant into a window relative to `now` (local-day boundaries via ISO date). */
export function windowForTime(targetIso: string, now: Date): ContextWindow {
  const target = new Date(targetIso);
  const diffMs = target.getTime() - now.getTime();
  const day = (d: Date) => d.toISOString().slice(0, 10);
  const today = day(now);
  const tomorrow = day(new Date(now.getTime() + 86_400_000));
  const targetDay = day(target);

  if (diffMs <= 0) return "current";
  if (targetDay === today) return "current";
  if (targetDay === tomorrow) return "tomorrow";
  if (diffMs <= 7 * 86_400_000) return "week";
  return "long_term";
}

/** Filter signals belonging to a window. */
export function signalsInWindow(signals: readonly Signal[], window: ContextWindow): Signal[] {
  return signals.filter((s) => s.window === window);
}

/** Group signals by window (fixed key order). */
export function groupByWindow(signals: readonly Signal[]): Record<ContextWindow, Signal[]> {
  const out: Record<ContextWindow, Signal[]> = {
    current: [],
    today: [],
    tomorrow: [],
    week: [],
    long_term: [],
  };
  for (const s of signals) out[s.window].push(s);
  return out;
}
