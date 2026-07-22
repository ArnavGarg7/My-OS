/**
 * Notification Intelligence (Sprint 6.1). A signal decides whether the user should be told, and how
 * loudly, purely from its ranked priority + severity (spec §Notification Intelligence). No AI.
 */
import type { NotificationLevel, SignalRanking, SignalSeverity } from "./types";
import { NOTIFY_THRESHOLDS } from "./constants";

/** Map a priority (0..100) to a notification level via the threshold table. */
export function levelForPriority(priority: number): NotificationLevel {
  for (const t of NOTIFY_THRESHOLDS) {
    if (priority >= t.min) return t.level;
  }
  return "silent";
}

/**
 * Decide the notification level for a ranked signal. Critical severity always escalates to at least
 * "important" regardless of priority; everything else follows the priority thresholds.
 */
export function decideNotification(
  ranking: SignalRanking,
  severity: SignalSeverity,
): NotificationLevel {
  const base = levelForPriority(ranking.priority);
  if (severity === "critical" && rank(base) < rank("important")) return "important";
  return base;
}

const LEVELS: NotificationLevel[] = ["silent", "suggestion", "reminder", "important", "critical"];
const rank = (l: NotificationLevel): number => LEVELS.indexOf(l);
