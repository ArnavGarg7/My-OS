import type { DayPhase, DayStatus, EnergyLevel, NoteType, WorkingHours } from "./constants";

/**
 * Today domain types (Sprint 2.1). The shapes the Today engine reads/writes.
 * These mirror the DB rows but are provider/DB-agnostic (dates are ISO strings).
 */

export interface DailyState {
  date: string; // YYYY-MM-DD
  wakeTime: string | null; // HH:mm
  sleepTarget: string | null; // HH:mm
  energyLevel: EnergyLevel | null;
  focusScore: number | null; // 0–100
  currentBlock: string | null;
  currentActivity: string | null;
  status: DayStatus;
  morningCompleted: boolean;
  eveningCompleted: boolean;
  lastRecalculatedAt: string | null; // ISO
}

export interface DailyFocus {
  date: string;
  mission: string | null;
  blocker: string | null;
  priority: string | null;
  deepWork: string | null;
  quickWin: string | null;
}

export interface EnergyEntry {
  at: string; // ISO
  level: EnergyLevel;
}

export interface DailyMetrics {
  date: string;
  completedTasks: number;
  deepWorkMinutes: number;
  meetings: number;
  interruptions: number;
  focusSwitches: number;
  plannerAccuracy: number | null; // 0–100
  energyEntries: EnergyEntry[];
}

export interface DailyNote {
  id: string;
  date: string;
  timestamp: string; // ISO
  content: string;
  type: NoteType;
}

export interface Decision {
  id: string;
  date: string;
  decision: string;
  reason: string | null;
  confidence: number | null; // 0–100
  accepted: boolean;
  dismissed: boolean;
  timestamp: string; // ISO
}

// --- Planner result types (deterministic calculations) ---

export interface RemainingDay {
  totalMinutes: number;
  elapsedMinutes: number;
  remainingMinutes: number;
  percentRemaining: number; // 0–100
}

export interface DayProgress {
  phase: DayPhase;
  percent: number; // 0–100 of the working day elapsed
}

export interface ProductiveWindow {
  start: string; // HH:mm
  end: string; // HH:mm
  minutes: number;
  active: boolean; // is `now` inside working hours
}

export interface Checkpoint {
  label: string;
  at: string; // HH:mm
  minutesUntil: number;
}

export interface EnergyTrend {
  trend: "up" | "down" | "flat";
  average: number; // mean energy weight
  latest: EnergyLevel | null;
  samples: number;
}

/** A deterministic snapshot of "where the day is right now". */
export interface TodaySnapshot {
  date: string;
  now: string; // ISO
  workingHours: WorkingHours;
  phase: DayPhase;
  remainingDay: RemainingDay;
  progress: DayProgress;
  productiveWindow: ProductiveWindow;
  nextCheckpoint: Checkpoint | null;
}
