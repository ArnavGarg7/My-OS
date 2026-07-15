import type { SessionType } from "./constants";
import type { FocusBreak, FocusSession, Interruption } from "./types";

/**
 * Deterministic focus fixtures (Sprint 3.2) for tests and stories. Fixed ids and
 * timestamps — no randomness, no `Date.now()`. Everything is derivable and repeatable.
 */
export const FIXED_NOW = new Date("2026-07-11T10:00:00.000Z");

let counter = 0;
/** Stable incrementing id source for engine tests. */
export function makeCounterId(prefix = "id"): () => string {
  return () => `${prefix}-${(counter += 1)}`;
}
export function resetCounter(): void {
  counter = 0;
}

export function makeSession(overrides: Partial<FocusSession> = {}): FocusSession {
  const base: FocusSession = {
    id: "session-1",
    taskId: "task-1",
    plannerBlockId: "block-1",
    projectId: "project-1",
    type: "deep_work",
    status: "running",
    startedAt: "2026-07-11T09:00:00.000Z",
    endedAt: null,
    pausedDurationMs: 0,
    pausedAt: null,
    plannedMinutes: 50,
    interruptions: [],
    breaks: [],
    notes: "",
    completed: false,
    energyBefore: 70,
    energyAfter: null,
    createdAt: "2026-07-11T09:00:00.000Z",
    updatedAt: "2026-07-11T09:00:00.000Z",
  };
  return { ...base, ...overrides };
}

export function makeInterruptionFixture(overrides: Partial<Interruption> = {}): Interruption {
  return {
    id: "int-1",
    type: "message",
    at: "2026-07-11T09:15:00.000Z",
    ...overrides,
  };
}

export function makeBreakFixture(overrides: Partial<FocusBreak> = {}): FocusBreak {
  return {
    id: "break-1",
    type: "short",
    startedAt: "2026-07-11T09:50:00.000Z",
    endedAt: "2026-07-11T10:00:00.000Z",
    plannedMinutes: 10,
    ...overrides,
  };
}

/** A completed session of a given type and focus length (minutes). */
export function completedSession(
  id: string,
  type: SessionType,
  minutes: number,
  overrides: Partial<FocusSession> = {},
): FocusSession {
  const start = new Date("2026-07-11T08:00:00.000Z");
  const end = new Date(start.getTime() + minutes * 60_000);
  return makeSession({
    id,
    type,
    status: "completed",
    completed: true,
    startedAt: start.toISOString(),
    endedAt: end.toISOString(),
    plannedMinutes: minutes,
    ...overrides,
  });
}
