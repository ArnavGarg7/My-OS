import { planToday } from "../today";
import type { DailyFocus, DailyMetrics, DailyState, WorkingHours } from "../today";
import type { AssemblerInput, BriefingContext } from "./types";

/**
 * Test fixtures for the Morning Briefing engine. Not a test file — imported by
 * the *.test.ts files to build deterministic inputs.
 */
export const WH: WorkingHours = { start: "09:00", end: "18:00" };

// Local Date so `getHours()` (used by the planner) is machine-tz-independent.
export const at = (h: number, m = 0) => new Date(2026, 6, 7, h, m, 0);

export function makeState(over: Partial<DailyState> = {}): DailyState {
  return {
    date: "2026-07-07",
    wakeTime: null,
    sleepTarget: null,
    energyLevel: null,
    focusScore: null,
    currentBlock: null,
    currentActivity: null,
    status: "idle",
    morningCompleted: false,
    eveningCompleted: false,
    lastRecalculatedAt: null,
    ...over,
  };
}

export function makeFocus(over: Partial<DailyFocus> = {}): DailyFocus {
  return {
    date: "2026-07-07",
    mission: null,
    blocker: null,
    priority: null,
    deepWork: null,
    quickWin: null,
    ...over,
  };
}

export function makeMetrics(over: Partial<DailyMetrics> = {}): DailyMetrics {
  return {
    date: "2026-07-07",
    completedTasks: 0,
    deepWorkMinutes: 0,
    meetings: 0,
    interruptions: 0,
    focusSwitches: 0,
    plannerAccuracy: null,
    energyEntries: [],
    ...over,
  };
}

export function makeInput(over: Partial<AssemblerInput> = {}): AssemblerInput {
  return {
    now: at(10),
    timezone: "UTC",
    name: "Arnav",
    state: makeState(),
    focus: makeFocus(),
    metrics: makeMetrics(),
    workingHours: WH,
    counts: { unreadInbox: 0, pendingDecisions: 0, pendingNotes: 0 },
    yesterday: null,
    ...over,
  };
}

export function makeContext(over: Partial<AssemblerInput> = {}): BriefingContext {
  const input = makeInput(over);
  const snapshot = planToday({
    date: input.state?.date ?? "2026-07-07",
    now: input.now,
    workingHours: input.workingHours,
  });
  return { ...input, snapshot, phase: snapshot.phase };
}
