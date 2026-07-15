import type { OrchestrationModule, PipelineKind } from "./constants";
import type { ExecutionStep } from "./types";

/**
 * Cross-module pipelines (Sprint 3.5). Each pipeline is an EXPLICIT, deterministic,
 * acyclic ordered chain of module steps — the exact flow the spec describes. This is
 * the single source of truth for execution order; every module here is an existing
 * engine, and each step's `mode` says whether it regenerates state, refreshes a read
 * model, only re-derives recommendations, or records an event.
 */
interface PipelineStepSpec {
  module: OrchestrationModule;
  mode: ExecutionStep["mode"];
}

/** The triggers that start each pipeline (informational + validation). */
export const PIPELINE_TRIGGERS: Record<PipelineKind, string[]> = {
  calendar: [
    "calendar.meeting_added",
    "calendar.meeting_removed",
    "calendar.meeting_changed",
    "calendar.availability_changed",
  ],
  planner: ["planner.generated", "planner.updated", "planner.cleared"],
  focus: [
    "focus.completed",
    "focus.interrupted",
    "focus.break_finished",
    "focus.recovery_completed",
  ],
  health: [
    "health.readiness_changed",
    "health.sleep_logged",
    "health.recovery_logged",
    "health.hydration_missed",
  ],
  finance: ["finance.budget_exceeded", "finance.bill_due", "finance.savings_complete"],
  goal: ["goal.updated", "goal.habit_missed", "goal.review_complete"],
  project: ["project.milestone_complete", "project.at_risk", "project.objective_complete"],
  inbox: ["inbox.overflow", "inbox.item_organized", "inbox.capture_created"],
  tomorrow: ["tomorrow.completed", "tomorrow.missing", "tomorrow.updated"],
  morning: ["morning.complete"],
};

/**
 * The ordered step chains. Note the deliberate constraints from the spec:
 *  • Health pipeline touches Planner only in `recommend` mode (never regenerates).
 *  • Focus pipeline updates Planner EXECUTION state, not the schedule.
 */
export const PIPELINES: Record<PipelineKind, PipelineStepSpec[]> = {
  calendar: [
    { module: "calendar", mode: "record" },
    { module: "planner", mode: "regenerate" },
    { module: "decision", mode: "regenerate" },
    { module: "morning", mode: "refresh" },
    { module: "tomorrow", mode: "refresh" },
    { module: "notification", mode: "regenerate" },
    { module: "timeline", mode: "record" },
    { module: "analytics", mode: "record" },
  ],
  planner: [
    { module: "planner", mode: "record" },
    { module: "focus", mode: "recommend" },
    { module: "decision", mode: "refresh" },
    { module: "notification", mode: "regenerate" },
    { module: "timeline", mode: "record" },
    { module: "analytics", mode: "record" },
  ],
  focus: [
    { module: "focus", mode: "record" },
    { module: "task", mode: "refresh" },
    { module: "planner", mode: "refresh" },
    { module: "decision", mode: "refresh" },
    { module: "health", mode: "refresh" },
    { module: "timeline", mode: "record" },
    { module: "analytics", mode: "record" },
  ],
  health: [
    { module: "health", mode: "record" },
    { module: "decision", mode: "refresh" },
    { module: "planner", mode: "recommend" },
    { module: "morning", mode: "refresh" },
    { module: "notification", mode: "regenerate" },
    { module: "timeline", mode: "record" },
    { module: "analytics", mode: "record" },
  ],
  finance: [
    { module: "finance", mode: "record" },
    { module: "decision", mode: "refresh" },
    { module: "notification", mode: "regenerate" },
    { module: "timeline", mode: "record" },
    { module: "analytics", mode: "record" },
  ],
  goal: [
    { module: "goal", mode: "record" },
    { module: "project", mode: "refresh" },
    { module: "decision", mode: "refresh" },
    { module: "planner", mode: "recommend" },
    { module: "timeline", mode: "record" },
    { module: "analytics", mode: "record" },
  ],
  project: [
    { module: "project", mode: "record" },
    { module: "task", mode: "refresh" },
    { module: "decision", mode: "refresh" },
    { module: "notification", mode: "regenerate" },
    { module: "timeline", mode: "record" },
    { module: "analytics", mode: "record" },
  ],
  inbox: [
    { module: "inbox", mode: "record" },
    { module: "decision", mode: "refresh" },
    { module: "planner", mode: "recommend" },
    { module: "notification", mode: "regenerate" },
    { module: "timeline", mode: "record" },
    { module: "analytics", mode: "record" },
  ],
  tomorrow: [
    { module: "tomorrow", mode: "record" },
    { module: "morning", mode: "refresh" },
    { module: "notification", mode: "regenerate" },
    { module: "timeline", mode: "record" },
    { module: "analytics", mode: "record" },
  ],
  morning: [
    { module: "morning", mode: "record" },
    { module: "planner", mode: "refresh" },
    { module: "focus", mode: "recommend" },
    { module: "timeline", mode: "record" },
    { module: "analytics", mode: "record" },
  ],
};

/** Resolve which pipeline an event belongs to (by prefix or explicit trigger list). */
export function pipelineForEvent(event: string): PipelineKind | null {
  for (const [kind, triggers] of Object.entries(PIPELINE_TRIGGERS)) {
    if (triggers.includes(event)) return kind as PipelineKind;
  }
  // Fall back to the event's module prefix (e.g. "calendar.foo" → calendar).
  const prefix = event.split(".")[0] as PipelineKind;
  return prefix in PIPELINES ? prefix : null;
}

export function pipelineSteps(pipeline: PipelineKind): PipelineStepSpec[] {
  return PIPELINES[pipeline];
}

/** All distinct modules a pipeline touches. */
export function pipelineModules(pipeline: PipelineKind): OrchestrationModule[] {
  return [...new Set(PIPELINES[pipeline].map((s) => s.module))];
}
