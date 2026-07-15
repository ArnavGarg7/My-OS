import { MAX_OCCURRENCES, WEEKDAY_INDEX } from "./constants";
import { ms } from "./timezone";
import type { CalendarEvent, RecurrenceRule } from "./types";

/**
 * Recurrence engine (Sprint 2.7). Deterministic expansion of a RFC5545 subset:
 * daily / weekly / monthly / yearly, interval, COUNT, UNTIL, weekly BYDAY, and
 * EXDATE exceptions. The Planner never computes recurrence itself.
 */
function addDays(d: Date, n: number): Date {
  const x = new Date(d.getTime());
  x.setDate(x.getDate() + n);
  return x;
}

function occurrence(event: CalendarEvent, startMs: number, durationMs: number): CalendarEvent {
  // Stable, unique id per occurrence so React keys + selection stay correct.
  return {
    ...event,
    id: `${event.id || "r"}::${startMs}`,
    startAt: new Date(startMs).toISOString(),
    endAt: new Date(startMs + durationMs).toISOString(),
    recurrenceRule: null,
    recurrenceParent: event.id || event.recurrenceParent || "",
  };
}

/** Expand a (possibly recurring) event into concrete occurrences within a range. */
export function expandRecurrence(
  event: CalendarEvent,
  rangeStartIso: string,
  rangeEndIso: string,
): CalendarEvent[] {
  const durationMs = ms(event.endAt) - ms(event.startAt);
  const rangeStart = ms(rangeStartIso);
  const rangeEnd = ms(rangeEndIso);
  const rule = event.recurrenceRule;

  if (!rule) {
    // A non-recurring event keeps its own id (only clamp check against range).
    return ms(event.startAt) < rangeEnd && ms(event.endAt) > rangeStart ? [event] : [];
  }

  const interval = Math.max(1, rule.interval);
  const untilMs = rule.until ? ms(rule.until) : null;
  const count = rule.count ?? null;
  const exdates = new Set((rule.exdates ?? []).map((d) => ms(d)));
  const byWeekday =
    rule.byWeekday && rule.byWeekday.length
      ? new Set(rule.byWeekday.map((w) => WEEKDAY_INDEX[w]))
      : null;

  const out: CalendarEvent[] = [];
  let generated = 0;

  const emit = (startMs: number): "stop" | "cont" => {
    if (untilMs !== null && startMs > untilMs) return "stop";
    if (count !== null && generated >= count) return "stop";
    if (startMs >= rangeEnd) return "stop";
    generated += 1;
    if (!exdates.has(startMs)) {
      if (startMs + durationMs > rangeStart) out.push(occurrence(event, startMs, durationMs));
    }
    return generated >= MAX_OCCURRENCES ? "stop" : "cont";
  };

  const base = new Date(event.startAt);

  if (rule.frequency === "weekly" && byWeekday) {
    // Day-by-day scan, honoring the week interval + BYDAY set.
    const baseWeek = Math.floor(startOfWeek(base).getTime() / (7 * 86_400_000));
    let cursor = new Date(base);
    for (let guard = 0; guard < MAX_OCCURRENCES * 7 + 14; guard++) {
      const weekIndex = Math.floor(startOfWeek(cursor).getTime() / (7 * 86_400_000)) - baseWeek;
      if (weekIndex % interval === 0 && byWeekday.has(cursor.getDay())) {
        const startMs = withTimeOf(cursor, base).getTime();
        if (startMs >= base.getTime()) {
          if (emit(startMs) === "stop") break;
        }
      }
      cursor = addDays(cursor, 1);
      if (untilMs !== null && cursor.getTime() > untilMs + 86_400_000) break;
      if (cursor.getTime() > rangeEnd) break;
    }
    return out;
  }

  // Simple stepping for daily / weekly / monthly / yearly.
  const cursor = new Date(base);
  for (let guard = 0; guard < MAX_OCCURRENCES; guard++) {
    if (emit(cursor.getTime()) === "stop") break;
    switch (rule.frequency) {
      case "daily":
        cursor.setDate(cursor.getDate() + interval);
        break;
      case "weekly":
        cursor.setDate(cursor.getDate() + 7 * interval);
        break;
      case "monthly":
        cursor.setMonth(cursor.getMonth() + interval);
        break;
      case "yearly":
        cursor.setFullYear(cursor.getFullYear() + interval);
        break;
    }
  }
  return out;
}

function startOfWeek(d: Date): Date {
  const x = new Date(d.getTime());
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

function withTimeOf(day: Date, timeSource: Date): Date {
  const x = new Date(day.getTime());
  x.setHours(timeSource.getHours(), timeSource.getMinutes(), timeSource.getSeconds(), 0);
  return x;
}

/** Human summary of a rule (for the inspector). */
export function describeRecurrence(rule: RecurrenceRule): string {
  const unit =
    rule.frequency === "daily"
      ? "day"
      : rule.frequency === "weekly"
        ? "week"
        : rule.frequency === "monthly"
          ? "month"
          : "year";
  const base = rule.interval === 1 ? `Every ${unit}` : `Every ${rule.interval} ${unit}s`;
  if (rule.byWeekday?.length) return `${base} on ${rule.byWeekday.join(", ")}`;
  if (rule.count) return `${base}, ${rule.count} times`;
  if (rule.until) return `${base}, until ${rule.until.slice(0, 10)}`;
  return base;
}
