import { RECURRENCE_FREQUENCIES, type RecurrenceFrequency } from "./constants";
import type { RecurrenceRule } from "./types";

/**
 * Recurrence (Sprint 2.5). Deterministic rule math + text parsing. Next
 * occurrence is generated on completion (no background scheduler yet).
 */

/** Advance a date by one rule interval. Pure — no timezone surprises (UTC math). */
export function nextOccurrence(rule: RecurrenceRule, from: Date): Date {
  const d = new Date(from.getTime());
  const n = Math.max(1, rule.interval);
  switch (rule.frequency) {
    case "daily":
      d.setUTCDate(d.getUTCDate() + n);
      break;
    case "weekly":
      d.setUTCDate(d.getUTCDate() + 7 * n);
      break;
    case "monthly":
      d.setUTCMonth(d.getUTCMonth() + n);
      break;
    case "yearly":
      d.setUTCFullYear(d.getUTCFullYear() + n);
      break;
  }
  return d;
}

/** Deterministic recurrence detection from text. Returns null if none. */
export function parseRecurrence(text: string): RecurrenceRule | null {
  const t = text.toLowerCase();

  // "every 2 weeks", "every 3 days"
  const everyN = t.match(/every\s+(\d+)\s+(day|week|month|year)s?/);
  if (everyN) {
    const interval = Math.max(1, parseInt(everyN[1]!, 10));
    const unit = everyN[2]!;
    const frequency = (unit === "day" ? "daily" : `${unit}ly`) as RecurrenceFrequency;
    return { frequency, interval };
  }

  if (/\b(daily|every\s+day)\b/.test(t)) return { frequency: "daily", interval: 1 };
  if (/\b(weekly|every\s+week)\b/.test(t)) return { frequency: "weekly", interval: 1 };
  if (/\b(monthly|every\s+month)\b/.test(t)) return { frequency: "monthly", interval: 1 };
  if (/\b(yearly|annually|every\s+year)\b/.test(t)) return { frequency: "yearly", interval: 1 };

  // "every monday" → weekly
  if (/every\s+(mon|tue|wed|thu|fri|sat|sun)/.test(t)) {
    return { frequency: "weekly", interval: 1 };
  }
  return null;
}

export function formatRecurrence(rule: RecurrenceRule): string {
  const unit = rule.frequency.replace(/ly$/, "");
  const noun = unit === "dai" ? "day" : unit;
  if (rule.interval === 1) return `Every ${noun}`;
  return `Every ${rule.interval} ${noun}s`;
}

export function isRecurrenceFrequency(value: string): value is RecurrenceFrequency {
  return (RECURRENCE_FREQUENCIES as readonly string[]).includes(value);
}
