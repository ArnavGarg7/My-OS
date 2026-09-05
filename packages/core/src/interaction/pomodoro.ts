/**
 * Pomodoro cycle logic (Stage 9). PURE — computes the phase sequence only. It does NOT
 * time anything or store sessions: a Pomodoro "work" phase IS a real Focus session (the
 * existing timestamp-based Focus engine remains the timer + the source of truth). This
 * module just decides what comes next (work → short break → … → long break → work).
 */

export interface PomodoroConfig {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  /** Work cycles completed before a long break. */
  cyclesBeforeLongBreak: number;
}

export const DEFAULT_POMODORO: PomodoroConfig = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
};

export type PomodoroPhase = "work" | "short_break" | "long_break";

export interface PomodoroState {
  phase: PomodoroPhase;
  /** How many work phases have been completed so far. */
  completedWorkCycles: number;
}

export function phaseMinutes(phase: PomodoroPhase, config: PomodoroConfig): number {
  if (phase === "work") return config.workMinutes;
  if (phase === "short_break") return config.shortBreakMinutes;
  return config.longBreakMinutes;
}

/** The starting state of a fresh Pomodoro run. */
export function startState(): PomodoroState {
  return { phase: "work", completedWorkCycles: 0 };
}

/**
 * Advance to the next phase after the current one completes. A completed work phase
 * increments the cycle count and leads to a long break every `cyclesBeforeLongBreak`,
 * otherwise a short break; a completed break returns to work.
 */
export function advance(state: PomodoroState, config: PomodoroConfig): PomodoroState {
  if (state.phase === "work") {
    const completed = state.completedWorkCycles + 1;
    const longDue = completed % Math.max(1, config.cyclesBeforeLongBreak) === 0;
    return { phase: longDue ? "long_break" : "short_break", completedWorkCycles: completed };
  }
  return { phase: "work", completedWorkCycles: state.completedWorkCycles };
}

/** Human label for a phase. */
export function phaseLabel(phase: PomodoroPhase): string {
  return phase === "work" ? "Deep Work" : phase === "short_break" ? "Short Break" : "Long Break";
}
