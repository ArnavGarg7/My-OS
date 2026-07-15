import { planToday } from "../today";
import type { DailyFocus, DailyMetrics, DailyState, WorkingHours } from "../today";
import type { Decision, DecisionContext } from "./types";

/** Test fixtures for the decision engine (imported by *.test.ts). */
export const WH: WorkingHours = { start: "09:00", end: "18:00" };
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

export function makeContext(
  over: Partial<Omit<DecisionContext, "snapshot">> = {},
): DecisionContext {
  const now = over.now ?? at(10);
  const workingHours = over.workingHours ?? WH;
  const state = over.state !== undefined ? over.state : makeState();
  const focus = over.focus !== undefined ? over.focus : makeFocus();
  const metrics = over.metrics !== undefined ? over.metrics : makeMetrics();
  const snapshot = planToday({ date: "2026-07-07", now, workingHours });
  return {
    now,
    timezone: over.timezone ?? "UTC",
    state,
    focus,
    metrics,
    workingHours,
    snapshot,
    inboxCount: over.inboxCount ?? 0,
    ...(over.project !== undefined ? { project: over.project } : {}),
    ...(over.health !== undefined ? { health: over.health } : {}),
    ...(over.finance !== undefined ? { finance: over.finance } : {}),
    ...(over.goal !== undefined ? { goal: over.goal } : {}),
    ...(over.analytics !== undefined ? { analytics: over.analytics } : {}),
    ...(over.tomorrow !== undefined ? { tomorrow: over.tomorrow } : {}),
    ...(over.focusMode !== undefined ? { focusMode: over.focusMode } : {}),
    ...(over.notifications !== undefined ? { notifications: over.notifications } : {}),
    ...(over.automation !== undefined ? { automation: over.automation } : {}),
    ...(over.orchestration !== undefined ? { orchestration: over.orchestration } : {}),
  };
}

export function makeDecision(over: Partial<Decision> = {}): Decision {
  return {
    id: "d1",
    ruleId: "protect-focus",
    type: "focus",
    title: "Protect your focus.",
    reason: "Everything's defined.",
    confidence: 50,
    priority: "medium",
    score: 50,
    state: "pending",
    inputsUsed: ["Focus"],
    expiresAt: null,
    deferredUntil: null,
    completedAt: null,
    createdAt: at(10).toISOString(),
    metadata: {},
    ...over,
  };
}
