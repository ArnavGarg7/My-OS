import { ACTION_KINDS, TRIGGER_KINDS, type ActionKind, type TriggerKind } from "./constants";

/**
 * Automation parser (Sprint 3.4). Deterministic mapping of short phrases to trigger /
 * action kinds. Whole-word matching; unknown input returns null (no guessing, no AI).
 */
const TRIGGER_ALIASES: Record<string, TriggerKind> = {
  planner: "planner",
  plan: "planner",
  task: "task",
  focus: "focus",
  calendar: "calendar",
  meeting: "calendar",
  notification: "notification",
  health: "health",
  journal: "journal",
  finance: "finance",
  budget: "finance",
  goals: "goals",
  goal: "goals",
  projects: "projects",
  project: "projects",
  timeline: "timeline",
  analytics: "analytics",
  tomorrow: "tomorrow",
  morning: "morning",
  inbox: "inbox",
  manual: "manual",
  time: "time",
};

const ACTION_ALIASES: Record<string, ActionKind> = {
  notify: "generate_notification",
  notification: "generate_notification",
  reminder: "create_reminder",
  focus: "start_focus",
  planner: "generate_planner",
  regenerate: "regenerate_planner",
  tomorrow: "open_tomorrow",
  decision: "generate_decision",
  journal: "open_journal",
  timeline: "log_timeline_event",
  analytics: "emit_analytics_event",
  noop: "noop",
};

export function parseTriggerKind(input: string): TriggerKind | null {
  const key = input.trim().toLowerCase();
  if ((TRIGGER_KINDS as readonly string[]).includes(key)) return key as TriggerKind;
  return TRIGGER_ALIASES[key] ?? null;
}

export function parseActionKind(input: string): ActionKind | null {
  const key = input.trim().toLowerCase();
  if ((ACTION_KINDS as readonly string[]).includes(key)) return key as ActionKind;
  return ACTION_ALIASES[key] ?? null;
}

export function isTriggerKind(value: string): value is TriggerKind {
  return (TRIGGER_KINDS as readonly string[]).includes(value);
}
