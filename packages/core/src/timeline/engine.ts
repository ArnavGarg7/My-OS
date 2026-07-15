import type { Grouping, SnapshotType } from "./constants";
import { SNAPSHOT_TYPES } from "./constants";
import { aggregate, buildDays, computeDay, toEvent } from "./aggregator";
import { filterEvents } from "./filters";
import { groupEvents } from "./grouping";
import { searchEvents } from "./search";
import { promoteMemories } from "./memories";
import { buildSnapshot, buildSnapshots } from "./snapshots";
import { computeHighlights } from "./highlights";
import { statistics } from "./selectors";
import type {
  TimelineEvent,
  TimelineEventInput,
  TimelineFilter,
  TimelineGroup,
  TimelineSnapshot,
} from "./types";

/**
 * TimelineEngine (Sprint 2.13). Pure deterministic orchestration over the
 * timeline sub-engines. The Timeline is an immutable read model: the engine only
 * reads and aggregates — it never mutates events. No React, DB, or randomness.
 */
export class TimelineEngine {
  /** Normalise a raw input into a canonical event with the supplied id. */
  materialize(input: TimelineEventInput, id: string): TimelineEvent {
    return toEvent(input, id);
  }

  /** The chronological feed, optionally filtered, newest first. */
  feed(events: TimelineEvent[], filter?: TimelineFilter): TimelineEvent[] {
    return filter ? filterEvents(events, filter) : aggregate(events);
  }

  group(events: TimelineEvent[], grouping: Grouping, filter?: TimelineFilter): TimelineGroup[] {
    return groupEvents(this.feed(events, filter), grouping);
  }

  day(events: TimelineEvent[], date: string) {
    return {
      day: computeDay(events, date),
      events: filterEvents(events, { from: date, to: date }),
    };
  }

  days(events: TimelineEvent[]) {
    return buildDays(events);
  }

  search(events: TimelineEvent[], query: string): TimelineEvent[] {
    return searchEvents(events, query);
  }

  memories(events: TimelineEvent[]) {
    return promoteMemories(events);
  }

  highlights(events: TimelineEvent[], today: string) {
    return computeHighlights(events, today);
  }

  snapshot(events: TimelineEvent[], type: SnapshotType, date: string): TimelineSnapshot {
    return buildSnapshot(events, type, date);
  }

  snapshots(
    events: TimelineEvent[],
    date: string,
    types: readonly SnapshotType[] = SNAPSHOT_TYPES,
  ) {
    return buildSnapshots(events, date, types);
  }

  statistics(events: TimelineEvent[]) {
    return statistics(events);
  }
}

export const timelineEngine = new TimelineEngine();
