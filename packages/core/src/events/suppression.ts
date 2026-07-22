/**
 * Signal Suppression (Sprint 6.1). Keeps the feed clean: suppress duplicates, expire obsolete
 * signals, supersede prior versions of the same thing, and escalate repeated risks. Pure — takes
 * `now` and the set of previously-known signals; never mutates inputs (returns new signals).
 */
import type { Signal, SignalSeverity } from "./types";

const ORDER: SignalSeverity[] = ["info", "low", "medium", "high", "critical"];

export interface SuppressResult {
  /** The signals to keep active this cycle. */
  active: Signal[];
  /** Signals whose status changed (expired/superseded) — for the timeline. */
  transitions: { signal: Signal; to: "expired" | "superseded" }[];
}

/**
 * Reconcile freshly-generated signals against the previously-known ones:
 * - expire prior signals past their `expiresAt`;
 * - a new signal with the same `dedupeKey` supersedes the prior one;
 * - a repeated risk (same key, still active) escalates one severity level;
 * - duplicate new signals (same dedupeKey) collapse to the first.
 */
export function suppressSignals(
  fresh: readonly Signal[],
  previous: readonly Signal[],
  now: Date,
): SuppressResult {
  const transitions: SuppressResult["transitions"] = [];
  const nowMs = now.getTime();

  // Index previous active signals by dedupeKey.
  const prevActive = new Map<string, Signal>();
  for (const p of previous) {
    if (p.status !== "active") continue;
    if (p.expiresAt && new Date(p.expiresAt).getTime() <= nowMs) {
      transitions.push({ signal: { ...p, status: "expired" }, to: "expired" });
      continue;
    }
    prevActive.set(p.dedupeKey, p);
  }

  // Dedupe fresh by key (first wins).
  const seen = new Set<string>();
  const deduped: Signal[] = [];
  for (const s of fresh) {
    if (seen.has(s.dedupeKey)) continue;
    seen.add(s.dedupeKey);
    deduped.push(s);
  }

  const active: Signal[] = [];
  for (const s of deduped) {
    const prior = prevActive.get(s.dedupeKey);
    if (prior) {
      // Supersede the prior instance.
      transitions.push({ signal: { ...prior, status: "superseded" }, to: "superseded" });
      // Escalate repeated risks.
      if (s.category === "risks") {
        active.push({ ...s, severity: escalate(s.severity) });
        continue;
      }
    }
    active.push(s);
    prevActive.delete(s.dedupeKey);
  }

  // Any previously-active signal not superseded this cycle stays active (still fresh).
  for (const p of prevActive.values()) active.push(p);

  return { active, transitions };
}

function escalate(sev: SignalSeverity): SignalSeverity {
  const i = ORDER.indexOf(sev);
  return ORDER[Math.min(ORDER.length - 1, i + 1)]!;
}

/** True when a signal has passed its expiry at `now`. */
export function isExpired(signal: Signal, now: Date): boolean {
  return !!signal.expiresAt && new Date(signal.expiresAt).getTime() <= now.getTime();
}
