import type {
  ExecutionPlan,
  OrchestrationContext,
  OrchestrationRun,
  OrchestrationTrigger,
  StepResult,
} from "./types";
import { buildPlan } from "./execution-plan";

/**
 * Deterministic orchestration fixtures (Sprint 3.5). Fixed ids + timestamps.
 */
export const FIXED_NOW = new Date("2026-07-15T12:00:00.000Z");

let counter = 0;
export function makeCounterId(prefix = "o"): () => string {
  return () => `${prefix}-${(counter += 1)}`;
}
export function resetCounter(): void {
  counter = 0;
}

export function makeContext(overrides: Partial<OrchestrationContext> = {}): OrchestrationContext {
  return { now: FIXED_NOW, unavailable: [], ...overrides };
}

export function makeTriggerFixture(
  overrides: Partial<OrchestrationTrigger> = {},
): OrchestrationTrigger {
  return {
    id: "trig-1",
    pipeline: "calendar",
    event: "calendar.meeting_added",
    source: "manual",
    timestamp: FIXED_NOW.toISOString(),
    payload: {},
    ...overrides,
  };
}

export function makePlan(overrides: Partial<ExecutionPlan> = {}): ExecutionPlan {
  const base = buildPlan("calendar", "calendar.meeting_added", makeContext());
  return { ...base, ...overrides };
}

export function makeStepResult(overrides: Partial<StepResult> = {}): StepResult {
  return {
    module: "planner",
    outcome: "completed",
    mode: "regenerate",
    runtimeMs: 20,
    ...overrides,
  };
}

export function makeRun(overrides: Partial<OrchestrationRun> = {}): OrchestrationRun {
  return {
    id: "run-1",
    pipeline: "calendar",
    trigger: "calendar.meeting_added",
    source: "manual",
    status: "completed",
    startedAt: "2026-07-15T11:59:00.000Z",
    completedAt: "2026-07-15T11:59:00.200Z",
    runtimeMs: 200,
    steps: [makeStepResult()],
    affected: ["calendar", "planner"],
    skipped: [],
    failures: 0,
    recoveries: 0,
    summary: "calendar: 2 completed",
    ...overrides,
  };
}
