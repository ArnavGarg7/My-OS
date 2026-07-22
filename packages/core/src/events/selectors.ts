/**
 * Signal selectors (Sprint 6.1). Pure read-model views over ranked signals that back the server's
 * `signals.*` endpoints and the Chief's situational awareness. No IO.
 */
import type { RankedSignal } from "./types";

/** The current active signals, highest priority first (already sorted by the engine). */
export function currentSignals(signals: readonly RankedSignal[]): RankedSignal[] {
  return signals.filter((s) => s.status === "active");
}

/** Signals in the current/today windows. */
export function todaySignals(signals: readonly RankedSignal[]): RankedSignal[] {
  return currentSignals(signals).filter((s) => s.window === "current" || s.window === "today");
}

/** Risk signals only. */
export function riskSignals(signals: readonly RankedSignal[]): RankedSignal[] {
  return currentSignals(signals).filter((s) => s.category === "risks");
}

/** Opportunity signals only. */
export function opportunitySignals(signals: readonly RankedSignal[]): RankedSignal[] {
  return currentSignals(signals).filter((s) => s.category === "opportunities");
}

/** Signals worth notifying about (level above silent). */
export function notifiableSignals(signals: readonly RankedSignal[]): RankedSignal[] {
  return currentSignals(signals).filter((s) => s.notify !== "silent");
}

/** The top N signals the Chief should treat as primary situational input. */
export function chiefInput(signals: readonly RankedSignal[], limit = 8): RankedSignal[] {
  return currentSignals(signals).slice(0, limit);
}

/** Count summary for a status bar / badge. */
export function signalCounts(signals: readonly RankedSignal[]): {
  total: number;
  risks: number;
  opportunities: number;
  notifiable: number;
} {
  const active = currentSignals(signals);
  return {
    total: active.length,
    risks: active.filter((s) => s.category === "risks").length,
    opportunities: active.filter((s) => s.category === "opportunities").length,
    notifiable: active.filter((s) => s.notify !== "silent").length,
  };
}
