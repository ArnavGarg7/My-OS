import type { AnalyticsContext } from "./types";
import { importanceFor, type TimelineEvent, type TimelineSource } from "../timeline";

/** Test fixtures for the analytics engine (imported by *.test.ts). */
export const at = (y: number, mo: number, d: number, h = 12, mi = 0) =>
  new Date(Date.UTC(y, mo, d, h, mi, 0)).toISOString();
export const day = (y: number, mo: number, d: number) =>
  new Date(Date.UTC(y, mo, d)).toISOString().slice(0, 10);

let seq = 0;
export function ev(over: Partial<TimelineEvent> = {}): TimelineEvent {
  const eventType = over.eventType ?? "task.completed";
  const source: TimelineSource = over.source ?? "task";
  return {
    id: over.id ?? `a_${++seq}`,
    eventType,
    source,
    entityId: over.entityId ?? null,
    title: over.title ?? "Event",
    summary: over.summary ?? over.title ?? "Event",
    timestamp: over.timestamp ?? at(2026, 6, 6),
    importance: over.importance ?? importanceFor(eventType),
    metadata: over.metadata ?? {},
  };
}

/** A busy week's worth of mixed events ending 2026-07-07. */
export function makeEvents(): TimelineEvent[] {
  return [
    ev({
      eventType: "task.completed",
      timestamp: at(2026, 6, 6, 9),
      metadata: { focusMinutes: 120, contextSwitches: 2 },
    }),
    ev({
      eventType: "task.completed",
      timestamp: at(2026, 6, 6, 11),
      metadata: { focusMinutes: 60 },
    }),
    ev({ eventType: "task.created", timestamp: at(2026, 6, 6, 8) }),
    ev({
      eventType: "decision.accepted",
      source: "decision",
      title: "Ship it",
      timestamp: at(2026, 6, 6, 10),
    }),
    ev({
      eventType: "habit.completed",
      source: "goal",
      title: "Meditate",
      timestamp: at(2026, 6, 5, 7),
    }),
    ev({
      eventType: "habit.completed",
      source: "goal",
      title: "Meditate",
      timestamp: at(2026, 6, 6, 7),
    }),
    ev({
      eventType: "habit.completed",
      source: "goal",
      title: "Read",
      timestamp: at(2026, 6, 6, 22),
    }),
    ev({
      eventType: "journal.created",
      source: "journal",
      title: "Notes",
      timestamp: at(2026, 6, 5, 21),
    }),
    ev({
      eventType: "finance.transaction",
      source: "finance",
      title: "Rent",
      timestamp: at(2026, 6, 4, 12),
      metadata: { amount: 15000, direction: "expense" },
    }),
    ev({
      eventType: "finance.transaction",
      source: "finance",
      title: "Coffee",
      timestamp: at(2026, 6, 6, 12),
      metadata: { amount: 200, direction: "expense" },
    }),
    ev({
      eventType: "calendar.meeting_finished",
      source: "calendar",
      title: "Standup",
      timestamp: at(2026, 6, 6, 14),
      metadata: { durationMinutes: 45 },
    }),
    ev({
      eventType: "goal.completed",
      source: "goal",
      title: "Ship v1",
      timestamp: at(2026, 6, 7, 9),
    }),
  ];
}

export function makeContext(over: Partial<AnalyticsContext> = {}): AnalyticsContext {
  return {
    now: over.now ?? new Date(at(2026, 6, 7, 18)),
    timezone: over.timezone ?? "Asia/Kolkata",
    events: over.events ?? makeEvents(),
    ...(over.health !== undefined ? { health: over.health } : {}),
    ...(over.finance !== undefined ? { finance: over.finance } : {}),
    ...(over.goals !== undefined ? { goals: over.goals } : {}),
    ...(over.projects !== undefined ? { projects: over.projects } : {}),
    ...(over.planner !== undefined ? { planner: over.planner } : {}),
    ...(over.journal !== undefined ? { journal: over.journal } : {}),
  };
}
