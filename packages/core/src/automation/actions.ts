import { ACTION_KINDS, type ActionKind } from "./constants";
import type { Action } from "./types";

/**
 * Action model (Sprint 3.4). Pure descriptors + human summaries. Actions reference
 * EXISTING services; the pure core never executes them — the server executor maps each
 * kind to a real service call. This module only describes and validates the shape.
 */
export function makeAction(
  id: string,
  kind: ActionKind,
  order: number,
  params: Record<string, unknown> = {},
): Action {
  return { id, kind, order, params };
}

/** Human-readable summary of an action (for preview + editor). */
export function summarizeAction(action: Action): string {
  switch (action.kind) {
    case "generate_notification":
      return `Generate a ${String(action.params.priority ?? "medium")} notification`;
    case "start_focus":
      return `Start a ${String(action.params.type ?? "focus")} session`;
    case "pause_focus":
      return "Pause the active focus session";
    case "resume_focus":
      return "Resume the paused focus session";
    case "complete_focus":
      return "Complete the active focus session";
    case "generate_planner":
      return "Generate today's planner";
    case "regenerate_planner":
      return "Regenerate today's planner";
    case "open_tomorrow":
      return "Open Tomorrow Studio";
    case "mark_decision_complete":
      return "Mark the current decision complete";
    case "generate_decision":
      return "Generate a decision";
    case "dismiss_decision":
      return "Dismiss the current decision";
    case "open_journal":
      return "Open the journal";
    case "log_timeline_event":
      return `Log a timeline event${action.params.title ? `: ${String(action.params.title)}` : ""}`;
    case "emit_analytics_event":
      return `Emit an analytics metric${action.params.kind ? ` (${String(action.params.kind)})` : ""}`;
    case "create_reminder":
      return `Create a reminder${action.params.title ? `: ${String(action.params.title)}` : ""}`;
    case "complete_reminder":
      return "Complete a reminder";
    case "run_custom_workflow":
      return `Run workflow ${String(action.params.workflow ?? "custom")}`;
    case "noop":
      return "Do nothing";
    default:
      return action.kind;
  }
}

export function isActionKind(value: string): value is ActionKind {
  return (ACTION_KINDS as readonly string[]).includes(value);
}

/** Actions sorted by their execution order. */
export function orderedActions(actions: Action[]): Action[] {
  return [...actions].sort((a, b) => a.order - b.order);
}
