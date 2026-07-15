import { emptyConditions } from "./conditions";
import type { AutomationDraft } from "./types";

/**
 * Built-in automations (Sprint 3.4). Deterministic rules the engine ships with. They
 * are editable but flagged `builtIn`. Each maps an existing module signal (trigger) to
 * actions that call existing services — no new feature logic. The server seeds these.
 */
function action(
  id: string,
  kind: AutomationDraft["actions"][number]["kind"],
  params: Record<string, unknown> = {},
) {
  return { id, kind, order: 0, params };
}

export const BUILTIN_AUTOMATIONS: AutomationDraft[] = [
  {
    name: "Planner generated → morning notification",
    description: "When today's planner is generated, generate a morning notification.",
    priority: "medium",
    trigger: { kind: "planner", event: "planner.generated" },
    conditions: emptyConditions(),
    actions: [
      action("a1", "generate_notification", {
        type: "planner",
        priority: "low",
        title: "Your plan is ready",
      }),
    ],
    policy: { policy: "run_once" },
    builtIn: true,
  },
  {
    name: "Focus completed → log timeline event",
    description: "When a focus session completes, log a timeline event.",
    priority: "low",
    trigger: { kind: "focus", event: "focus.completed" },
    conditions: emptyConditions(),
    actions: [action("a1", "log_timeline_event", { title: "Focus session completed" })],
    policy: { policy: "run_always" },
    builtIn: true,
  },
  {
    name: "Water goal missed → hydration reminder",
    description: "When hydration is behind target, create a reminder.",
    priority: "low",
    trigger: { kind: "health", event: "health.water_overdue" },
    conditions: emptyConditions(),
    actions: [action("a1", "create_reminder", { title: "Time to hydrate", source: "health" })],
    policy: { policy: "cooldown", cooldownMinutes: 120 },
    builtIn: true,
  },
  {
    name: "Tomorrow not planned → notification",
    description: "When tomorrow isn't planned, generate a reminder notification.",
    priority: "medium",
    trigger: { kind: "tomorrow", event: "tomorrow.not_planned" },
    conditions: emptyConditions(),
    actions: [
      action("a1", "generate_notification", {
        type: "reminder",
        priority: "medium",
        title: "Plan tomorrow",
      }),
    ],
    policy: { policy: "cooldown", cooldownMinutes: 720 },
    builtIn: true,
  },
  {
    name: "Budget exceeded → warning",
    description: "When a budget is exceeded, generate a warning notification.",
    priority: "high",
    trigger: { kind: "finance", event: "finance.budget_exceeded" },
    conditions: emptyConditions(),
    actions: [
      action("a1", "generate_notification", {
        type: "warning",
        priority: "high",
        title: "Budget exceeded",
      }),
    ],
    policy: { policy: "cooldown", cooldownMinutes: 240 },
    builtIn: true,
  },
  {
    name: "Meeting starts → pause focus",
    description: "When a meeting starts, pause the active focus session.",
    priority: "high",
    trigger: { kind: "calendar", event: "calendar.meeting_started" },
    conditions: {
      combinator: "and",
      conditions: [{ id: "c1", field: "focusSessionActive", operator: "equals", value: true }],
    },
    actions: [action("a1", "pause_focus", {})],
    policy: { policy: "run_always" },
    builtIn: true,
  },
  {
    name: "Meeting ends → resume focus",
    description: "When a meeting ends, resume the paused focus session.",
    priority: "high",
    trigger: { kind: "calendar", event: "calendar.meeting_ended" },
    conditions: emptyConditions(),
    actions: [action("a1", "resume_focus", {})],
    policy: { policy: "run_always" },
    builtIn: true,
  },
  {
    name: "Inbox overflow → cleanup reminder",
    description: "When more than 20 inbox items are unread, generate a cleanup reminder.",
    priority: "low",
    trigger: { kind: "inbox", event: "inbox.overflow" },
    conditions: emptyConditions(),
    actions: [
      action("a1", "generate_notification", {
        type: "reminder",
        priority: "low",
        title: "Clear your inbox",
      }),
    ],
    policy: { policy: "cooldown", cooldownMinutes: 360 },
    builtIn: true,
  },
  {
    name: "Planner drift → generate decision",
    description: "When focus drifts from the planner, generate a decision.",
    priority: "medium",
    trigger: { kind: "focus", event: "focus.planner_drift" },
    conditions: emptyConditions(),
    actions: [action("a1", "generate_decision", {})],
    policy: { policy: "cooldown", cooldownMinutes: 120 },
    builtIn: true,
  },
];
