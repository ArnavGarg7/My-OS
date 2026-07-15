import { aggregate } from "./aggregator";
import type { TimelineEvent } from "./types";

/**
 * Search engine (Sprint 2.13). Deterministic keyword matching over title,
 * summary, source, event type and stringified metadata values. No semantic
 * search — that is deferred to the AI phase. Multi-term queries are AND-matched.
 */

function haystack(e: TimelineEvent): string {
  const metaValues = Object.values(e.metadata)
    .filter((v) => typeof v === "string" || typeof v === "number")
    .map((v) => String(v))
    .join(" ");
  return `${e.title} ${e.summary} ${e.source} ${e.eventType} ${metaValues}`.toLowerCase();
}

export function searchEvents(events: TimelineEvent[], query: string): TimelineEvent[] {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return aggregate(events);
  const matched = events.filter((e) => {
    const hay = haystack(e);
    return terms.every((t) => hay.includes(t));
  });
  return aggregate(matched);
}
