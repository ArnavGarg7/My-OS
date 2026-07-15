import type {
  Grouping,
  HighlightCategory,
  MemoryType,
  SnapshotType,
  TimelineSource,
} from "./constants";

/**
 * Timeline engine types (Sprint 2.13). The canonical `TimelineEvent` is the
 * immutable unit of history: every module maps its activity onto this shape.
 * All derived views (days, groups, memories, snapshots, highlights) are pure
 * functions over `TimelineEvent[]`. No React, DB or randomness.
 */
export interface TimelineEvent {
  id: string;
  /** Dotted kind, e.g. "goal.completed" — free-form but registry-described. */
  eventType: string;
  source: TimelineSource;
  /** The originating entity (goal/task/…) id, if any — the Timeline never owns it. */
  entityId: string | null;
  title: string;
  summary: string;
  timestamp: string; // ISO
  importance: number; // 0–100
  metadata: Record<string, unknown>;
}

/** What a caller supplies to record an event — id/importance/summary are derived. */
export interface TimelineEventInput {
  eventType: string;
  source: TimelineSource;
  entityId?: string | null;
  title: string;
  summary?: string;
  timestamp?: string;
  importance?: number;
  metadata?: Record<string, unknown>;
}

/** Daily aggregate snapshot (persisted to `timeline_days`). */
export interface TimelineDay {
  date: string; // YYYY-MM-DD
  eventCount: number;
  completionScore: number; // 0–100
  focusMinutes: number;
  healthScore: number; // 0–100
  journalWritten: boolean;
  plannerAccuracy: number; // 0–100
}

/** A promoted, optionally-pinned memory (persisted to `timeline_memories`). */
export interface TimelineMemory {
  id: string;
  eventId: string;
  memoryType: MemoryType;
  title: string;
  description: string;
  pinned: boolean;
  at: string; // ISO — the source event's timestamp
}

/** A period rollup (persisted to `timeline_snapshots`). */
export interface TimelineSnapshot {
  snapshotType: SnapshotType;
  periodStart: string; // YYYY-MM-DD
  periodEnd: string; // YYYY-MM-DD
  summary: string;
  metadata: {
    eventCount: number;
    bySource: Record<string, number>;
    topSources: { source: TimelineSource; count: number }[];
    memorableCount: number;
    activeDays: number;
    busiestDay: { date: string; count: number } | null;
  };
}

/** A grouped bucket of events (hour/day/week/month/year). */
export interface TimelineGroup {
  key: string; // canonical bucket key
  label: string;
  grouping: Grouping;
  events: TimelineEvent[];
  count: number;
}

/** A single deterministic highlight. */
export interface TimelineHighlight {
  category: HighlightCategory;
  title: string;
  value: number;
  detail: string;
  eventId: string | null;
  at: string | null; // ISO
}

/** A consecutive-day streak for a predicate (e.g. journal written). */
export interface TimelineStreak {
  label: string;
  length: number;
  start: string | null; // YYYY-MM-DD
  end: string | null; // YYYY-MM-DD
  current: boolean;
}

/** Feed filtering. */
export interface TimelineFilter {
  sources?: TimelineSource[];
  eventTypes?: string[];
  minImportance?: number;
  from?: string; // ISO or YYYY-MM-DD (inclusive)
  to?: string; // ISO or YYYY-MM-DD (inclusive)
}

/** Aggregate statistics over an event set. */
export interface TimelineStatistics {
  totalEvents: number;
  bySource: Record<string, number>;
  memorableCount: number;
  activeDays: number;
  busiestDay: { date: string; count: number } | null;
  firstAt: string | null;
  lastAt: string | null;
  averagePerActiveDay: number;
}
