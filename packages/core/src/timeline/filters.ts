import { aggregate } from "./aggregator";
import type { TimelineEvent, TimelineFilter } from "./types";

/**
 * Filter engine (Sprint 2.13). Deterministic predicates over the event stream:
 * by source, event type, importance floor and inclusive date range. Composable
 * and side-effect-free. Range bounds accept ISO timestamps or YYYY-MM-DD dates.
 */

/** Normalise a bound to a comparable ISO instant (dates → start/end of day). */
function lowerBound(v: string): string {
  return v.length === 10 ? `${v}T00:00:00.000Z` : v;
}
function upperBound(v: string): string {
  return v.length === 10 ? `${v}T23:59:59.999Z` : v;
}

export function filterEvents(events: TimelineEvent[], filter: TimelineFilter): TimelineEvent[] {
  const sources = filter.sources && filter.sources.length ? new Set(filter.sources) : null;
  const types = filter.eventTypes && filter.eventTypes.length ? new Set(filter.eventTypes) : null;
  const from = filter.from ? lowerBound(filter.from) : null;
  const to = filter.to ? upperBound(filter.to) : null;

  const out = events.filter((e) => {
    if (sources && !sources.has(e.source)) return false;
    if (types && !types.has(e.eventType)) return false;
    if (typeof filter.minImportance === "number" && e.importance < filter.minImportance)
      return false;
    if (from && e.timestamp < from) return false;
    if (to && e.timestamp > to) return false;
    return true;
  });
  return aggregate(out);
}

export function bySource(
  events: TimelineEvent[],
  source: TimelineEvent["source"],
): TimelineEvent[] {
  return filterEvents(events, { sources: [source] });
}

export function byImportance(events: TimelineEvent[], minImportance: number): TimelineEvent[] {
  return filterEvents(events, { minImportance });
}

export function byDateRange(events: TimelineEvent[], from: string, to: string): TimelineEvent[] {
  return filterEvents(events, { from, to });
}
