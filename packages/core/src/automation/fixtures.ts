import { emptyConditions } from "./conditions";
import type {
  Action,
  AutomationContext,
  AutomationRule,
  ExecutionRecord,
  TriggerEvent,
} from "./types";

/**
 * Deterministic automation fixtures (Sprint 3.4). Fixed ids + timestamps — no
 * randomness, no `Date.now()`.
 */
export const FIXED_NOW = new Date("2026-07-15T10:00:00.000Z");

let counter = 0;
export function makeCounterId(prefix = "a"): () => string {
  return () => `${prefix}-${(counter += 1)}`;
}
export function resetCounter(): void {
  counter = 0;
}

export function makeActionFixture(overrides: Partial<Action> = {}): Action {
  return {
    id: "act-1",
    kind: "generate_notification",
    params: { type: "reminder", priority: "medium", title: "Do the thing" },
    order: 0,
    ...overrides,
  };
}

export function makeRule(overrides: Partial<AutomationRule> = {}): AutomationRule {
  return {
    id: "rule-1",
    name: "Test rule",
    description: "A deterministic test rule.",
    status: "enabled",
    priority: "medium",
    trigger: { kind: "planner", event: "planner.generated" },
    conditions: emptyConditions(),
    actions: [makeActionFixture()],
    policy: { policy: "run_always" },
    builtIn: false,
    createdAt: "2026-07-15T09:00:00.000Z",
    updatedAt: "2026-07-15T09:00:00.000Z",
    ...overrides,
  };
}

export function makeEvent(overrides: Partial<TriggerEvent> = {}): TriggerEvent {
  return {
    id: "evt-1",
    kind: "planner",
    event: "planner.generated",
    source: "planner",
    timestamp: "2026-07-15T10:00:00.000Z",
    payload: {},
    metadata: {},
    ...overrides,
  };
}

export function makeContext(overrides: Partial<AutomationContext> = {}): AutomationContext {
  return {
    now: FIXED_NOW,
    timezone: "UTC",
    workingHours: { start: "09:00", end: "17:00" },
    quietHours: { enabled: true, start: "22:00", end: "07:00" },
    focusSessionActive: false,
    plannerGenerated: true,
    ...overrides,
  };
}

export function makeRecord(overrides: Partial<ExecutionRecord> = {}): ExecutionRecord {
  return {
    id: "exec-1",
    ruleId: "rule-1",
    outcome: "completed",
    triggeredAt: "2026-07-15T09:30:00.000Z",
    completedAt: "2026-07-15T09:30:01.000Z",
    runtimeMs: 1000,
    actionResults: [{ actionId: "act-1", kind: "generate_notification", ok: true }],
    error: null,
    ...overrides,
  };
}
