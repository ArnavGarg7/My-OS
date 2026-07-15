import type { SnapshotType, TimelineSource } from "./constants";
import { aggregate, buildDays, dayOf } from "./aggregator";
import { filterEvents } from "./filters";
import { isMemorable } from "./memories";
import type { TimelineEvent, TimelineSnapshot } from "./types";

/**
 * Snapshot engine (Sprint 2.13). Pure period rollups — weekly, monthly,
 * quarterly, yearly. Summarises existing events into counts, top sources and
 * activity; it never generates narrative prose (deferred to the AI phase).
 */

const DAY_MS = 86_400_000;

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Inclusive [start, end] YYYY-MM-DD bounds of the period containing `date`. */
export function periodBounds(type: SnapshotType, date: string): { start: string; end: string } {
  const d = new Date(`${date}T00:00:00Z`);
  const y = d.getUTCFullYear();
  switch (type) {
    case "week": {
      const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0
      const start = new Date(d.getTime() - dayNum * DAY_MS);
      const end = new Date(start.getTime() + 6 * DAY_MS);
      return { start: ymd(start), end: ymd(end) };
    }
    case "month": {
      const start = new Date(Date.UTC(y, d.getUTCMonth(), 1));
      const end = new Date(Date.UTC(y, d.getUTCMonth() + 1, 0));
      return { start: ymd(start), end: ymd(end) };
    }
    case "quarter": {
      const q = Math.floor(d.getUTCMonth() / 3);
      const start = new Date(Date.UTC(y, q * 3, 1));
      const end = new Date(Date.UTC(y, q * 3 + 3, 0));
      return { start: ymd(start), end: ymd(end) };
    }
    case "year":
      return { start: `${y}-01-01`, end: `${y}-12-31` };
  }
}

/** Build a snapshot for the given period from the full event set. */
export function buildSnapshot(
  events: TimelineEvent[],
  type: SnapshotType,
  date: string,
): TimelineSnapshot {
  const { start, end } = periodBounds(type, date);
  const inPeriod = filterEvents(events, { from: start, to: end });

  const bySource: Record<string, number> = {};
  for (const e of inPeriod) bySource[e.source] = (bySource[e.source] ?? 0) + 1;
  const topSources = (Object.entries(bySource) as [TimelineSource, number][])
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, 3)
    .map(([source, count]) => ({ source, count }));

  const days = buildDays(inPeriod);
  const busiest = days.reduce<{ date: string; count: number } | null>(
    (best, d) =>
      !best || d.eventCount > best.count ? { date: d.date, count: d.eventCount } : best,
    null,
  );
  const memorableCount = inPeriod.filter(isMemorable).length;
  const activeDays = new Set(inPeriod.map((e) => dayOf(e.timestamp))).size;

  const summary =
    inPeriod.length === 0
      ? `No activity between ${start} and ${end}.`
      : `${inPeriod.length} events across ${activeDays} active day${activeDays === 1 ? "" : "s"}` +
        (topSources[0] ? `, led by ${topSources[0].source} (${topSources[0].count}).` : ".") +
        (memorableCount ? ` ${memorableCount} memorable.` : "");

  return {
    snapshotType: type,
    periodStart: start,
    periodEnd: end,
    summary,
    metadata: {
      eventCount: inPeriod.length,
      bySource,
      topSources,
      memorableCount,
      activeDays,
      busiestDay: busiest,
    },
  };
}

/** Convenience: snapshot the period containing today for each requested type. */
export function buildSnapshots(
  events: TimelineEvent[],
  date: string,
  types: readonly SnapshotType[],
): TimelineSnapshot[] {
  const all = aggregate(events);
  return types.map((t) => buildSnapshot(all, t, date));
}
