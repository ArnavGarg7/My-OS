import {
  ESCALATION_LEVELS,
  PRIORITY_RANK,
  escalationForPriority,
  type EscalationLevel,
  type NotificationPriority,
} from "./constants";
import type { Notification } from "./types";

/**
 * Priority + escalation helpers (Sprint 3.3). Pure ordering and escalation logic.
 * Escalation climbs the ladder deterministically with snooze count — the longer a
 * high-priority notification is ignored, the more insistent its channel.
 */
export function comparePriority(a: NotificationPriority, b: NotificationPriority): number {
  return PRIORITY_RANK[b] - PRIORITY_RANK[a];
}

export function isHigherPriority(a: NotificationPriority, b: NotificationPriority): boolean {
  return PRIORITY_RANK[a] > PRIORITY_RANK[b];
}

/** The highest priority among a set of notifications (null if empty). */
export function topPriority(notifications: Notification[]): NotificationPriority | null {
  let best: NotificationPriority | null = null;
  for (const n of notifications) {
    if (best === null || isHigherPriority(n.priority, best)) best = n.priority;
  }
  return best;
}

/** Bump an escalation level up the ladder by `steps` (clamped). */
export function escalate(level: EscalationLevel, steps = 1): EscalationLevel {
  const idx = ESCALATION_LEVELS.indexOf(level);
  const next = Math.min(ESCALATION_LEVELS.length - 1, Math.max(0, idx + steps));
  return ESCALATION_LEVELS[next]!;
}

/**
 * Resolve the escalation level for a notification: base level from priority, bumped
 * once per snooze beyond the first. Silent/low never escalate past banner.
 */
export function resolveEscalation(
  priority: NotificationPriority,
  snoozeCount: number,
): EscalationLevel {
  const base = escalationForPriority(priority);
  if (priority === "silent" || priority === "low") return base;
  const steps = Math.max(0, snoozeCount - 1);
  return escalate(base, steps);
}
