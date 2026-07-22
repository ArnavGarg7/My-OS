/**
 * Explainable Signals (Sprint 6.1). Every signal answers "why was I created?" (spec §Explainable
 * Signals). The generator/detectors already attach a structured `SignalExplanation`; these helpers
 * render it to text for the UI and the Chief. Pure.
 */
import type { RankedSignal, Signal } from "./types";

/** Render a signal's explanation as a compact multi-line string. */
export function renderExplanation(signal: Signal): string {
  const { headline, reasons, implication } = signal.explanation;
  const why = reasons.map((r) => `• ${r}`).join("\n");
  return `${headline}\n${why}\n→ ${implication}`;
}

/** A one-line summary suitable for a feed row. */
export function signalHeadline(signal: Signal): string {
  return signal.explanation.headline;
}

/** A Chief-facing brief: headline + the single most important reason + priority. */
export function chiefBrief(signal: RankedSignal): string {
  const topReason = signal.explanation.reasons[0] ?? "";
  return `${signal.explanation.headline} (${topReason}) — priority ${signal.ranking.priority}`;
}
