import type { Grouping } from "./constants";
import { aggregate } from "./aggregator";
import type { TimelineEvent, TimelineGroup } from "./types";

/**
 * Grouping engine (Sprint 2.13). Buckets the chronological stream by hour, day,
 * week, month or year. Deterministic: keys are canonical (UTC-based) and groups
 * are emitted newest-bucket-first with newest-event-first inside.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** ISO week number (1–53), ISO-8601, for a UTC date. */
export function isoWeek(d: Date): { year: number; week: number } {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (date.getUTCDay() + 6) % 7; // Mon=0
  date.setUTCDate(date.getUTCDate() - dayNum + 3); // nearest Thursday
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return { year: date.getUTCFullYear(), week };
}

/** Canonical bucket key + human label for an ISO timestamp at a granularity. */
export function bucketFor(iso: string, grouping: Grouping): { key: string; label: string } {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const mo = d.getUTCMonth();
  const day = d.getUTCDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  switch (grouping) {
    case "hour": {
      const h = d.getUTCHours();
      return {
        key: `${y}-${pad(mo + 1)}-${pad(day)}T${pad(h)}`,
        label: `${MONTHS[mo]} ${day}, ${pad(h)}:00`,
      };
    }
    case "day":
      return { key: `${y}-${pad(mo + 1)}-${pad(day)}`, label: `${MONTHS[mo]} ${day}, ${y}` };
    case "week": {
      const { year, week } = isoWeek(d);
      return { key: `${year}-W${pad(week)}`, label: `Week ${week}, ${year}` };
    }
    case "month":
      return { key: `${y}-${pad(mo + 1)}`, label: `${MONTHS[mo]} ${y}` };
    case "year":
      return { key: `${y}`, label: `${y}` };
  }
}

/** Group the stream into ordered buckets. */
export function groupEvents(events: TimelineEvent[], grouping: Grouping): TimelineGroup[] {
  const ordered = aggregate(events); // newest first
  const map = new Map<string, TimelineGroup>();
  for (const e of ordered) {
    const { key, label } = bucketFor(e.timestamp, grouping);
    const existing = map.get(key);
    if (existing) {
      existing.events.push(e);
      existing.count += 1;
    } else {
      map.set(key, { key, label, grouping, events: [e], count: 1 });
    }
  }
  // Map preserves insertion order, which is already newest-bucket-first.
  return Array.from(map.values());
}
