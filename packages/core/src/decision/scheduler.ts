import { DEFER_MINUTES, DISMISS_COOLDOWN_MS, type DeferOption } from "./constants";
import type { Decision } from "./types";

/**
 * Decision scheduling (Sprint 2.3). Deterministic defer / expiry / cooldown
 * math. No timers, no side effects — the caller persists the results.
 */

/** Resolve when a deferred decision should reappear. */
export function computeDeferUntil(option: DeferOption, now: Date, custom?: Date | null): Date {
  if (option === "custom") {
    return custom ?? new Date(now.getTime() + 60 * 60 * 1000);
  }
  if (option === "tomorrow") {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(6, 0, 0, 0); // reappear at the start of tomorrow
    return d;
  }
  return new Date(now.getTime() + DEFER_MINUTES[option] * 60 * 1000);
}

/** Minutes from `now` until an ISO timestamp (null when absent). */
export function minutesUntil(iso: string | null, now: Date): number | null {
  if (!iso) return null;
  return Math.round((new Date(iso).getTime() - now.getTime()) / 60000);
}

/** Is a deferred decision now due to reappear? */
export function isDue(deferredUntil: string | null, now: Date): boolean {
  if (!deferredUntil) return true;
  return new Date(deferredUntil).getTime() <= now.getTime();
}

/** Has a decision passed its expiry? */
export function isExpired(expiresAt: string | null, now: Date): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() <= now.getTime();
}

/** The cooldown end for a decision dismissed at `now`. */
export function cooldownUntil(now: Date): Date {
  return new Date(now.getTime() + DISMISS_COOLDOWN_MS);
}

/** Is a dismissed decision still inside its cooldown window? */
export function isInCooldown(decision: Pick<Decision, "metadata">, now: Date): boolean {
  const until = decision.metadata?.["cooldownUntil"];
  if (typeof until !== "string") return false;
  return new Date(until).getTime() > now.getTime();
}
