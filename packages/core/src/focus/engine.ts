import type { BreakType, InterruptionType, SessionType } from "./constants";
import { canFocus } from "./session";
import {
  abandonSession,
  addInterruption as addInterruptionTx,
  beginBreak as beginBreakTx,
  cancelSession,
  completeSession,
  createSession,
  pauseSession,
  resumeSession,
  setNotes,
  startSession,
  switchTask,
  FocusTransitionError,
} from "./session";
import { makeBreak, recommendBreak } from "./breaks";
import { makeInterruption } from "./interruptions";
import { computeMetrics } from "./metrics";
import { buildReadiness, type HealthReadinessInput } from "./readiness";
import { buildRecommendations } from "./recommendations";
import { computeSignals, type FocusSignalInput } from "./signals";
import { buildSummary } from "./summary";
import { computeTimer } from "./timer";
import type { FocusBreak, FocusSession, Interruption, StartSessionInput } from "./types";

/**
 * FocusEngine (Sprint 3.2). A thin, pure orchestrator over the focus primitives. It
 * generates ids + reads the clock through injected functions so it stays fully
 * deterministic and testable. It performs NO IO — the server calls these methods and
 * persists the returned sessions. It composes existing engines' data (planner blocks,
 * tasks, health readiness) but owns and mutates only focus execution state.
 */
export interface EngineDeps {
  /** Deterministic id source (server passes randomUUID; tests pass a counter). */
  newId: () => string;
  /** Clock source (server passes () => new Date(); tests pass a fixed date). */
  now: () => Date;
}

export class FocusEngine {
  constructor(private readonly deps: EngineDeps) {}

  private id(): string {
    return this.deps.newId();
  }

  private clock(): Date {
    return this.deps.now();
  }

  /** Create + immediately start a session. Meeting sessions cannot be focus work. */
  start(input: StartSessionInput): FocusSession {
    const type: SessionType = input.type ?? "focus";
    if (type !== "meeting" && !canFocus(type)) {
      throw new FocusTransitionError(`Cannot start a focus session of type ${type}`);
    }
    const now = this.clock();
    const draft = createSession(input, { id: this.id(), now });
    return startSession(draft, now);
  }

  /** Create an idle session without starting it (for a scheduled/queued session). */
  create(input: StartSessionInput): FocusSession {
    return createSession(input, { id: this.id(), now: this.clock() });
  }

  pause(session: FocusSession): FocusSession {
    return pauseSession(session, this.clock());
  }

  resume(session: FocusSession): FocusSession {
    return resumeSession(session, this.clock());
  }

  complete(session: FocusSession, energyAfter?: number | null): FocusSession {
    return completeSession(session, this.clock(), energyAfter);
  }

  cancel(session: FocusSession): FocusSession {
    return cancelSession(session, this.clock());
  }

  abandon(session: FocusSession): FocusSession {
    return abandonSession(session, this.clock());
  }

  switchTask(
    session: FocusSession,
    target: { taskId?: string | null; projectId?: string | null; plannerBlockId?: string | null },
  ): FocusSession {
    return switchTask(session, target, this.clock());
  }

  setNotes(session: FocusSession, notes: string): FocusSession {
    return setNotes(session, notes, this.clock());
  }

  /** Begin a break. Type/minutes default to the deterministic recommendation. */
  beginBreak(
    session: FocusSession,
    opts?: { type?: BreakType; minutes?: number; readinessScore?: number | null },
  ): { session: FocusSession; brk: FocusBreak } {
    const now = this.clock();
    const rec = recommendBreak(session, now, opts?.readinessScore ?? null);
    const type = opts?.type ?? rec.type;
    const minutes = opts?.minutes ?? rec.minutes;
    const brk = makeBreak(this.id(), now, type, minutes);
    return { session: beginBreakTx(session, brk, now), brk };
  }

  /** Log an interruption on the active session. */
  addInterruption(
    session: FocusSession,
    type: InterruptionType,
    note?: string,
  ): { session: FocusSession; interruption: Interruption } {
    const now = this.clock();
    const interruption = makeInterruption(this.id(), type, now, note);
    return { session: addInterruptionTx(session, interruption, now), interruption };
  }

  // ── Read models ────────────────────────────────────────────────────────────
  timer(session: FocusSession) {
    return computeTimer(session, this.clock());
  }

  metrics(sessions: FocusSession[]) {
    return computeMetrics(sessions, this.clock());
  }

  readiness(input: HealthReadinessInput | null) {
    return buildReadiness(input);
  }

  recommendations(session: FocusSession | null, readiness: HealthReadinessInput | null) {
    return buildRecommendations(
      session,
      this.clock(),
      readiness ? buildReadiness(readiness) : null,
    );
  }

  signals(input: Omit<FocusSignalInput, "now">) {
    return computeSignals({ ...input, now: this.clock() });
  }

  summary(active: FocusSession | null, todaysSessions: FocusSession[]) {
    return buildSummary(active, todaysSessions, this.clock());
  }
}

/** Convenience constructor with real clock + injected id source. */
export function createFocusEngine(
  newId: () => string,
  now: () => Date = () => new Date(),
): FocusEngine {
  return new FocusEngine({ newId, now });
}
