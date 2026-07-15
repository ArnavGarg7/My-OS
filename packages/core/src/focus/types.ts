import type {
  BreakType,
  InterruptionType,
  ReadinessLevel,
  SessionStatus,
  SessionType,
} from "./constants";

/**
 * Focus engine types (Sprint 3.2). A FocusSession is the unit of execution. The
 * timer is derived from timestamps + a `now` — nothing about elapsed/remaining is
 * stored. Focus references Task/Planner/Project entities; it never owns them.
 */
export interface Interruption {
  id: string;
  type: InterruptionType;
  at: string; // ISO
  note?: string;
}

export interface FocusBreak {
  id: string;
  type: BreakType;
  startedAt: string; // ISO
  endedAt: string | null; // ISO — null while the break is active
  plannedMinutes: number;
}

export interface FocusSession {
  id: string;
  taskId: string | null;
  plannerBlockId: string | null;
  projectId: string | null;
  type: SessionType;
  status: SessionStatus;
  startedAt: string | null; // ISO — null while idle
  endedAt: string | null; // ISO
  /** Total accumulated paused time, in milliseconds (excludes the live pause). */
  pausedDurationMs: number;
  /** When the current pause/break began (ISO), or null if not paused. */
  pausedAt: string | null;
  plannedMinutes: number;
  interruptions: Interruption[];
  breaks: FocusBreak[];
  notes: string;
  completed: boolean;
  energyBefore: number | null; // 0–100
  energyAfter: number | null; // 0–100
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

/** A draft for starting a session. Fields tolerate explicit `undefined` (zod). */
export interface StartSessionInput {
  taskId?: string | null | undefined;
  plannerBlockId?: string | null | undefined;
  projectId?: string | null | undefined;
  type?: SessionType | undefined;
  plannedMinutes?: number | undefined;
  energyBefore?: number | null | undefined;
  notes?: string | undefined;
}

/** Pure timer read-model for a session at a given `now`. */
export interface TimerState {
  status: SessionStatus;
  elapsedMs: number; // wall time since start
  focusMs: number; // effective focus time (elapsed − paused/break)
  pausedMs: number; // total paused + break time
  remainingMs: number; // planned − focus (clamped ≥ 0)
  plannedMs: number;
  overrunMs: number; // focus beyond planned (clamped ≥ 0)
  estimatedFinish: string | null; // ISO — when remaining reaches 0 at `now`
  progress: number; // 0–100 of planned
  interruptions: number;
}

/** A deterministic break recommendation. */
export interface BreakRecommendation {
  recommend: boolean;
  type: BreakType;
  minutes: number;
  reason: string;
}

/** Derived focus metrics for a set of sessions (never stored). */
export interface FocusMetrics {
  focusPercent: number; // deep+shallow / total working span
  deepWorkMinutes: number;
  shallowMinutes: number;
  breakMinutes: number;
  interruptions: number;
  longestSessionMinutes: number;
  averageSessionMinutes: number;
  completionRate: number; // completed / total
  plannerAccuracy: number; // sessions linked to a planner block that completed
  recoveredMinutes: number; // recovery/hydration/walk break minutes
  totalSessions: number;
  completedSessions: number;
}

/** Readiness for focusing, from Health signals (Sprint 2.9). */
export interface FocusReadiness {
  level: ReadinessLevel;
  score: number; // 0–100
  hydrationPercent: number;
  recovery: string;
  sleepMinutes: number;
  headline: string;
}

/** A deterministic focus recommendation. */
export interface FocusRecommendation {
  id: string;
  title: string;
  detail: string;
  action:
    | "continue"
    | "take_break"
    | "hydrate"
    | "switch_task"
    | "recovery_walk"
    | "finish_task"
    | "resume_planner";
  tone: "info" | "warning" | "success";
}

/** Deterministic signals surfaced to the Decision engine. */
export interface FocusSignals {
  active: boolean;
  status: SessionStatus;
  tooManyInterruptions: boolean;
  longUnfinished: boolean;
  plannerDrift: boolean; // running a non-planner session while planner blocks await
  focusMinutesToday: number;
}

/** Compact summary for status bar / context panel / Morning / Tomorrow. */
export interface FocusSummary {
  active: boolean;
  status: SessionStatus;
  sessionType: SessionType | null;
  remainingMinutes: number;
  focusMinutesToday: number;
  deepWorkMinutesToday: number;
  completedToday: number;
  interruptionsToday: number;
}
