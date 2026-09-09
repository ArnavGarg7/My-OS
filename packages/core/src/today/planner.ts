import {
  DEFAULT_FOCUS_BLOCK_MINUTES,
  DEFAULT_WORKING_HOURS,
  ENERGY_WEIGHT,
  FOCUS_SCORE,
  PHASE_BOUNDARIES,
  type DayPhase,
  type EnergyLevel,
  type WorkingHours,
} from "./constants";
import type {
  Checkpoint,
  DailyMetrics,
  DayProgress,
  EnergyEntry,
  EnergyTrend,
  ProductiveWindow,
  RemainingDay,
  TodaySnapshot,
} from "./types";

/**
 * TodayPlanner (Sprint 2.1). Deterministic, side-effect-free calculations — the
 * math behind "what should I do next". No LLM, no AI, no randomness. Given the
 * same inputs it always returns the same output.
 */

const MINUTES_PER_DAY = 24 * 60;

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  const hours = Number.parseInt(h ?? "0", 10);
  const mins = Number.parseInt(m ?? "0", 10);
  if (Number.isNaN(hours) || Number.isNaN(mins)) return 0;
  return Math.min(MINUTES_PER_DAY, Math.max(0, hours * 60 + mins));
}

export function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(MINUTES_PER_DAY, Math.round(minutes)));
  const h = Math.floor(clamped / 60) % 24;
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Wall-clock minutes since midnight, evaluated in an IANA time zone when one is
 * given (otherwise the host's local time). Everything day-phase / working-hours
 * related must be computed in the USER's zone, not the server process's — in
 * production the server runs UTC, so `Date#getHours` would bucket the day wrong.
 */
function wallClockMinutes(now: Date, timeZone?: string): number {
  if (!timeZone) return now.getHours() * 60 + now.getMinutes();
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone,
      hourCycle: "h23",
      hour: "2-digit",
      minute: "2-digit",
    }).formatToParts(now);
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
    return (hour % 24) * 60 + minute;
  } catch {
    return now.getHours() * 60 + now.getMinutes();
  }
}

/** Minutes since midnight for a Date, in the user's time zone when provided. */
export function minutesOfDay(now: Date, timeZone?: string): number {
  return wallClockMinutes(now, timeZone);
}

/** The local calendar date (YYYY-MM-DD) in a given IANA time zone. */
export function todayInTimeZone(timeZone: string, now: Date = new Date()): string {
  try {
    // en-CA renders as YYYY-MM-DD.
    return new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  } catch {
    return new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
  }
}

/** Bucket the current clock time into a coarse phase of day (in the user's zone). */
export function getDayPhase(now: Date = new Date(), timeZone?: string): DayPhase {
  const hour = Math.floor(wallClockMinutes(now, timeZone) / 60);
  if (hour < PHASE_BOUNDARIES.morningEnd) return "morning";
  if (hour < PHASE_BOUNDARIES.afternoonEnd) return "afternoon";
  if (hour < PHASE_BOUNDARIES.eveningEnd) return "evening";
  return "night";
}

/** How much of the working day is left. */
export function calculateRemainingDay(
  now: Date = new Date(),
  workingHours: WorkingHours = DEFAULT_WORKING_HOURS,
  timeZone?: string,
): RemainingDay {
  const start = timeToMinutes(workingHours.start);
  const end = timeToMinutes(workingHours.end);
  const total = Math.max(0, end - start);
  const nowMin = minutesOfDay(now, timeZone);
  const elapsed = Math.max(0, Math.min(total, nowMin - start));
  const remaining = Math.max(0, total - elapsed);
  return {
    totalMinutes: total,
    elapsedMinutes: elapsed,
    remainingMinutes: remaining,
    percentRemaining: total === 0 ? 0 : Math.round((remaining / total) * 100),
  };
}

/** Progress through the working day (0–100) + the current phase. */
export function calculateDayProgress(
  now: Date = new Date(),
  workingHours: WorkingHours = DEFAULT_WORKING_HOURS,
  timeZone?: string,
): DayProgress {
  const { totalMinutes, elapsedMinutes } = calculateRemainingDay(now, workingHours, timeZone);
  const percent = totalMinutes === 0 ? 0 : Math.round((elapsedMinutes / totalMinutes) * 100);
  return { phase: getDayPhase(now, timeZone), percent };
}

/**
 * The next suggested deep-work window: a fixed-length block from the next round
 * half-hour, clamped to working hours. `active` reflects whether we're currently
 * inside working hours.
 */
export function calculateProductiveWindow(
  now: Date = new Date(),
  workingHours: WorkingHours = DEFAULT_WORKING_HOURS,
  blockMinutes: number = DEFAULT_FOCUS_BLOCK_MINUTES,
  timeZone?: string,
): ProductiveWindow {
  const start = timeToMinutes(workingHours.start);
  const end = timeToMinutes(workingHours.end);
  const nowMin = minutesOfDay(now, timeZone);
  const inHours = nowMin >= start && nowMin < end;

  const roundedNow = Math.ceil(nowMin / 30) * 30;
  const windowStart = Math.max(start, Math.min(roundedNow, Math.max(start, end - blockMinutes)));
  const windowEnd = Math.min(end, windowStart + blockMinutes);

  return {
    start: minutesToTime(windowStart),
    end: minutesToTime(windowEnd),
    minutes: Math.max(0, windowEnd - windowStart),
    active: inHours,
  };
}

/** The next meaningful checkpoint (work start, midday, work end). */
export function calculateNextCheckpoint(
  now: Date = new Date(),
  workingHours: WorkingHours = DEFAULT_WORKING_HOURS,
  timeZone?: string,
): Checkpoint | null {
  const start = timeToMinutes(workingHours.start);
  const end = timeToMinutes(workingHours.end);
  const midday = Math.round((start + end) / 2);
  const nowMin = minutesOfDay(now, timeZone);

  const checkpoints: Checkpoint[] = [
    { label: "Start of work", at: minutesToTime(start), minutesUntil: start - nowMin },
    { label: "Midday", at: minutesToTime(midday), minutesUntil: midday - nowMin },
    { label: "End of work", at: minutesToTime(end), minutesUntil: end - nowMin },
  ];

  const upcoming = checkpoints
    .filter((c) => c.minutesUntil > 0)
    .sort((a, b) => a.minutesUntil - b.minutesUntil);
  return upcoming[0] ?? null;
}

/**
 * Deterministic focus score (0–100) from the day's metrics. Rewards deep-work +
 * completed tasks; penalizes interruptions + context switches.
 */
export function calculateFocusScore(
  metrics: Pick<
    DailyMetrics,
    "deepWorkMinutes" | "completedTasks" | "interruptions" | "focusSwitches"
  >,
): number {
  const deepWork =
    Math.min(1, metrics.deepWorkMinutes / FOCUS_SCORE.deepWorkTargetMinutes) *
    FOCUS_SCORE.deepWorkWeight;
  const tasks =
    Math.min(1, metrics.completedTasks / FOCUS_SCORE.taskTarget) * FOCUS_SCORE.taskWeight;
  const penalties =
    metrics.interruptions * FOCUS_SCORE.interruptionPenalty +
    metrics.focusSwitches * FOCUS_SCORE.focusSwitchPenalty;
  const raw = FOCUS_SCORE.base + deepWork + tasks - penalties;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

/** Energy trend across the day's energy check-ins. */
export function calculateEnergyTrend(entries: EnergyEntry[]): EnergyTrend {
  if (entries.length === 0) {
    return { trend: "flat", average: 0, latest: null, samples: 0 };
  }
  const weights = entries.map((e) => ENERGY_WEIGHT[e.level]);
  const average = weights.reduce((sum, w) => sum + w, 0) / weights.length;
  const first = weights[0]!;
  const last = weights[weights.length - 1]!;
  const trend: EnergyTrend["trend"] = last > first ? "up" : last < first ? "down" : "flat";
  const latest: EnergyLevel = entries[entries.length - 1]!.level;
  return { trend, average: Math.round(average * 100) / 100, latest, samples: entries.length };
}

/** Assemble a full deterministic snapshot of the day. */
export function planToday(params: {
  date: string;
  now?: Date;
  workingHours?: WorkingHours;
  focusBlockMinutes?: number;
  /** The user's IANA zone. Day phase + working-hours math are computed in it. */
  timezone?: string;
}): TodaySnapshot {
  const now = params.now ?? new Date();
  const workingHours = params.workingHours ?? DEFAULT_WORKING_HOURS;
  const tz = params.timezone;
  return {
    date: params.date,
    now: now.toISOString(),
    workingHours,
    phase: getDayPhase(now, tz),
    remainingDay: calculateRemainingDay(now, workingHours, tz),
    progress: calculateDayProgress(now, workingHours, tz),
    productiveWindow: calculateProductiveWindow(now, workingHours, params.focusBlockMinutes, tz),
    nextCheckpoint: calculateNextCheckpoint(now, workingHours, tz),
  };
}
