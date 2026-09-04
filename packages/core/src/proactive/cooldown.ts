import type { ProactiveIntervention, ResolvedCondition } from "./types";

/**
 * Cooldown (Stage 6). The Notification engine dedups against ACTIVE notifications only,
 * so a *dismissed* condition would otherwise be re-created on the next cycle — spam.
 * This closes that gap deterministically: an intervention whose `dedupeKey` was
 * dismissed/completed within the cooldown window is suppressed.
 *
 * Because the `dedupeKey` is stable per underlying condition and changes when the
 * condition materially changes (e.g. a new focus window, a new deadline date), this
 * distinguishes "same condition" (stay quiet) from "new meaningful condition" (may
 * resurface immediately). Completed conditions get a longer cooldown than dismissed
 * ones — acting on something shouldn't nag you again as quickly as dismissing it.
 */
export const DEFAULT_COOLDOWN_MINUTES = 240; // 4h after a dismissal
const COMPLETED_COOLDOWN_MULTIPLIER = 2; // acted-on conditions rest twice as long

/** Minutes since an ISO instant, or Infinity if unparseable/absent. */
function minutesSince(iso: string, now: Date): number {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) return Infinity;
  return (now.getTime() - t) / 60_000;
}

/**
 * Is this condition currently in cooldown? True when it was resolved (dismissed or
 * completed) more recently than its cooldown window allows.
 */
export function inCooldown(
  dedupeKey: string,
  resolved: readonly ResolvedCondition[],
  now: Date,
  cooldownMinutes = DEFAULT_COOLDOWN_MINUTES,
): boolean {
  return resolved.some((r) => {
    if (r.dedupeKey !== dedupeKey) return false;
    const window =
      r.status === "completed" ? cooldownMinutes * COMPLETED_COOLDOWN_MULTIPLIER : cooldownMinutes;
    return minutesSince(r.resolvedAt, now) < window;
  });
}

/** Remove interventions whose condition is still cooling down after a dismissal/completion. */
export function applyCooldown(
  interventions: readonly ProactiveIntervention[],
  resolved: readonly ResolvedCondition[],
  now: Date,
  cooldownMinutes = DEFAULT_COOLDOWN_MINUTES,
): ProactiveIntervention[] {
  return interventions.filter((i) => !inCooldown(i.dedupeKey, resolved, now, cooldownMinutes));
}
