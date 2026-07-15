import { TERMINAL_STATUSES, type SessionStatus, type SessionType } from "./constants";
import type { FocusBreak, FocusSession, Interruption, StartSessionInput } from "./types";
import { DEFAULT_SESSION_MINUTES } from "./constants";

/**
 * Pure session lifecycle (Sprint 3.2). Every transition returns a NEW session — no
 * mutation, no side effects, no clock of its own (the caller passes `now` and ids).
 * Guards enforce the lifecycle: Idle→Running→Paused/Break→Running→Completed, plus
 * cancel/abandon and switchTask. Illegal transitions throw so the server/UI can
 * surface a clear error rather than corrupt state.
 */

export class FocusTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FocusTransitionError";
  }
}

function assert(condition: boolean, message: string): asserts condition {
  if (!condition) throw new FocusTransitionError(message);
}

function isTerminal(status: SessionStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

interface DraftIds {
  id: string;
  now: Date;
}

/** Create an idle draft. Meeting/break types are allowed but never "deep work". */
export function createSession(input: StartSessionInput, ids: DraftIds): FocusSession {
  const nowIso = ids.now.toISOString();
  return {
    id: ids.id,
    taskId: input.taskId ?? null,
    plannerBlockId: input.plannerBlockId ?? null,
    projectId: input.projectId ?? null,
    type: input.type ?? "focus",
    status: "idle",
    startedAt: null,
    endedAt: null,
    pausedDurationMs: 0,
    pausedAt: null,
    plannedMinutes: Math.max(1, input.plannedMinutes ?? DEFAULT_SESSION_MINUTES),
    interruptions: [],
    breaks: [],
    notes: input.notes ?? "",
    completed: false,
    energyBefore: input.energyBefore ?? null,
    energyAfter: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function touch(session: FocusSession, now: Date): FocusSession {
  return { ...session, updatedAt: now.toISOString() };
}

/** Idle → Running. Starts the clock. */
export function startSession(session: FocusSession, now: Date): FocusSession {
  assert(session.status === "idle", `Cannot start a session that is ${session.status}`);
  return touch(
    { ...session, status: "running", startedAt: now.toISOString(), pausedAt: null },
    now,
  );
}

/** Running → Paused. Records when the pause began (live pause time accrues from here). */
export function pauseSession(session: FocusSession, now: Date): FocusSession {
  assert(session.status === "running", `Cannot pause a session that is ${session.status}`);
  return touch({ ...session, status: "paused", pausedAt: now.toISOString() }, now);
}

/** Paused/Break → Running. Folds the live pause span into the accumulated total. */
export function resumeSession(session: FocusSession, now: Date): FocusSession {
  assert(
    session.status === "paused" || session.status === "break",
    `Cannot resume a session that is ${session.status}`,
  );
  const pausedAt = session.pausedAt ? Date.parse(session.pausedAt) : null;
  const delta = pausedAt !== null ? Math.max(0, now.getTime() - pausedAt) : 0;
  // Close any active (unfinished) break when resuming.
  const breaks = session.breaks.map((b) =>
    b.endedAt === null ? { ...b, endedAt: now.toISOString() } : b,
  );
  return touch(
    {
      ...session,
      status: "running",
      pausedDurationMs: session.pausedDurationMs + delta,
      pausedAt: null,
      breaks,
    },
    now,
  );
}

/** Running → Break. Like pause, but attaches a break record. */
export function beginBreak(session: FocusSession, brk: FocusBreak, now: Date): FocusSession {
  assert(session.status === "running", `Cannot break from a session that is ${session.status}`);
  return touch(
    {
      ...session,
      status: "break",
      pausedAt: now.toISOString(),
      breaks: [...session.breaks, brk],
    },
    now,
  );
}

/** Any active state → Completed. Folds a live pause in first, stamps energyAfter. */
export function completeSession(
  session: FocusSession,
  now: Date,
  energyAfter?: number | null,
): FocusSession {
  assert(!isTerminal(session.status), `Session is already ${session.status}`);
  const settled =
    session.status === "paused" || session.status === "break"
      ? resumeSession(session, now)
      : session;
  return touch(
    {
      ...settled,
      status: "completed",
      completed: true,
      endedAt: now.toISOString(),
      pausedAt: null,
      energyAfter: energyAfter ?? settled.energyAfter,
    },
    now,
  );
}

/** Any non-terminal state → Cancelled (discarded, not counted as completed work). */
export function cancelSession(session: FocusSession, now: Date): FocusSession {
  assert(!isTerminal(session.status), `Session is already ${session.status}`);
  return touch(
    {
      ...session,
      status: "cancelled",
      completed: false,
      endedAt: now.toISOString(),
      pausedAt: null,
    },
    now,
  );
}

/** Any non-terminal state → Abandoned (left incomplete; time still counts). */
export function abandonSession(session: FocusSession, now: Date): FocusSession {
  assert(!isTerminal(session.status), `Session is already ${session.status}`);
  const settled =
    session.status === "paused" || session.status === "break"
      ? resumeSession(session, now)
      : session;
  return touch(
    {
      ...settled,
      status: "abandoned",
      completed: false,
      endedAt: now.toISOString(),
      pausedAt: null,
    },
    now,
  );
}

/**
 * Switch the task/project a running session serves. Keeps the clock running — this
 * is a re-target, not a restart. Does NOT complete or mutate the old task.
 */
export function switchTask(
  session: FocusSession,
  target: { taskId?: string | null; projectId?: string | null; plannerBlockId?: string | null },
  now: Date,
): FocusSession {
  assert(
    session.status === "running" || session.status === "paused",
    `Cannot switch task on a session that is ${session.status}`,
  );
  return touch(
    {
      ...session,
      taskId: target.taskId !== undefined ? target.taskId : session.taskId,
      projectId: target.projectId !== undefined ? target.projectId : session.projectId,
      plannerBlockId:
        target.plannerBlockId !== undefined ? target.plannerBlockId : session.plannerBlockId,
    },
    now,
  );
}

/** Append an interruption to a running/paused/break session. */
export function addInterruption(
  session: FocusSession,
  interruption: Interruption,
  now: Date,
): FocusSession {
  assert(!isTerminal(session.status), `Cannot log an interruption on a ${session.status} session`);
  return touch({ ...session, interruptions: [...session.interruptions, interruption] }, now);
}

/** Replace the free-text notes on a session. */
export function setNotes(session: FocusSession, notes: string, now: Date): FocusSession {
  return touch({ ...session, notes }, now);
}

/** Whether a given session type may begin a focus (non-meeting) work session. */
export function canFocus(type: SessionType): boolean {
  return type !== "meeting";
}
