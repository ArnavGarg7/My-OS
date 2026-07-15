import { aggregate, dayOf } from "./aggregator";
import { isMemorable } from "./memories";
import type { TimelineEvent, TimelineStatistics } from "./types";

/**
 * Timeline selectors (Sprint 2.13). Read-only helpers over the event stream for
 * the UI + context panel: latest N, lookup by id, neighbours, entity-related
 * events, and aggregate statistics. All deterministic.
 */

export function latest(events: TimelineEvent[], limit: number): TimelineEvent[] {
  return aggregate(events).slice(0, limit);
}

export function byId(events: TimelineEvent[], id: string): TimelineEvent | null {
  return events.find((e) => e.id === id) ?? null;
}

/** The events immediately before/after a given event in the stream (newest first). */
export function neighbors(
  events: TimelineEvent[],
  id: string,
): { previous: TimelineEvent | null; next: TimelineEvent | null } {
  const ordered = aggregate(events);
  const idx = ordered.findIndex((e) => e.id === id);
  if (idx === -1) return { previous: null, next: null };
  return {
    // "next" = further back in time (later in the newest-first array).
    previous: ordered[idx - 1] ?? null,
    next: ordered[idx + 1] ?? null,
  };
}

/** Other events referencing the same originating entity. */
export function relatedTo(events: TimelineEvent[], event: TimelineEvent): TimelineEvent[] {
  if (!event.entityId) return [];
  return aggregate(events).filter((e) => e.id !== event.id && e.entityId === event.entityId);
}

export function statistics(events: TimelineEvent[]): TimelineStatistics {
  const ordered = aggregate(events);
  const bySource: Record<string, number> = {};
  const byDay = new Map<string, number>();
  for (const e of ordered) {
    bySource[e.source] = (bySource[e.source] ?? 0) + 1;
    const day = dayOf(e.timestamp);
    byDay.set(day, (byDay.get(day) ?? 0) + 1);
  }
  let busiestDay: { date: string; count: number } | null = null;
  for (const [date, count] of byDay) {
    if (!busiestDay || count > busiestDay.count) busiestDay = { date, count };
  }
  const activeDays = byDay.size;
  return {
    totalEvents: ordered.length,
    bySource,
    memorableCount: ordered.filter(isMemorable).length,
    activeDays,
    busiestDay,
    firstAt: ordered[ordered.length - 1]?.timestamp ?? null,
    lastAt: ordered[0]?.timestamp ?? null,
    averagePerActiveDay: activeDays ? Math.round((ordered.length / activeDays) * 10) / 10 : 0,
  };
}
