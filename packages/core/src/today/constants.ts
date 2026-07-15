/**
 * Today domain constants (Sprint 2.1). Enumerations + deterministic defaults for
 * the Today engine. Pure — no IO. Growable.
 */

export const ENERGY_LEVELS = ["low", "medium", "high"] as const;
export type EnergyLevel = (typeof ENERGY_LEVELS)[number];

export const DAY_STATUSES = ["idle", "planning", "active", "break", "wrapping_up", "done"] as const;
export type DayStatus = (typeof DAY_STATUSES)[number];

export const NOTE_TYPES = ["note", "thought", "focus", "reflection", "idea"] as const;
export type NoteType = (typeof NOTE_TYPES)[number];

export const DAY_PHASES = ["morning", "afternoon", "evening", "night"] as const;
export type DayPhase = (typeof DAY_PHASES)[number];

/** A working-day window as local wall-clock times (HH:mm). */
export interface WorkingHours {
  start: string;
  end: string;
}

export const DEFAULT_WORKING_HOURS: WorkingHours = { start: "09:00", end: "18:00" };

/** Default deep-work / focus block length, in minutes. */
export const DEFAULT_FOCUS_BLOCK_MINUTES = 90;

/** Clock-hour boundaries used to bucket the day into phases. */
export const PHASE_BOUNDARIES = { morningEnd: 12, afternoonEnd: 17, eveningEnd: 21 } as const;

/** Numeric weight of each energy level (for trend + averages). */
export const ENERGY_WEIGHT: Record<EnergyLevel, number> = { low: 1, medium: 2, high: 3 };

/** Deterministic focus-score tuning (see planner.calculateFocusScore). */
export const FOCUS_SCORE = {
  base: 40,
  deepWorkTargetMinutes: 120,
  deepWorkWeight: 40,
  taskTarget: 8,
  taskWeight: 20,
  interruptionPenalty: 3,
  focusSwitchPenalty: 2,
} as const;
