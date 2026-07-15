/**
 * Orchestration engine constants (Sprint 3.5). The Orchestration Engine is the final
 * Phase-3 platform layer — it makes every existing deterministic engine cooperate. It
 * receives a trigger, builds a dependency graph of affected modules, orders them
 * topologically and asks the server to run EXISTING services in order. It owns NO
 * feature logic. Deterministic — no AI, no randomness, no timers, no polling.
 */

/** The modules orchestration can coordinate (each is an existing engine). */
export const ORCHESTRATION_MODULES = [
  "calendar",
  "planner",
  "focus",
  "task",
  "decision",
  "health",
  "finance",
  "goal",
  "project",
  "inbox",
  "notification",
  "morning",
  "tomorrow",
  "timeline",
  "analytics",
] as const;
export type OrchestrationModule = (typeof ORCHESTRATION_MODULES)[number];

/** DB enum `orchestration_step` — the step a module plays in a run. */
export const ORCHESTRATION_STEPS = ORCHESTRATION_MODULES;
export type OrchestrationStep = OrchestrationModule;

/** The pipelines a trigger can start. Each maps to a fixed downstream module chain. */
export const PIPELINE_KINDS = [
  "calendar",
  "planner",
  "focus",
  "health",
  "finance",
  "goal",
  "project",
  "inbox",
  "tomorrow",
  "morning",
] as const;
export type PipelineKind = (typeof PIPELINE_KINDS)[number];

/** Run lifecycle status (DB enum `orchestration_status`). */
export const ORCHESTRATION_STATUSES = [
  "pending",
  "running",
  "completed",
  "recovering",
  "recovered",
  "failed",
  "skipped",
] as const;
export type OrchestrationStatus = (typeof ORCHESTRATION_STATUSES)[number];

/** Per-step outcome. */
export const STEP_OUTCOMES = [
  "pending",
  "running",
  "completed",
  "skipped",
  "failed",
  "recovered",
] as const;
export type StepOutcome = (typeof STEP_OUTCOMES)[number];

/** Deterministic recovery strategies (DB enum `recovery_strategy`). */
export const RECOVERY_STRATEGIES = [
  "retry_step", // retry only the failed step
  "skip_downstream", // skip the failed step + everything depending on it
  "use_previous", // proceed using the module's previous value (e.g. readiness)
  "skip_step", // skip only the failed step, continue downstream
  "notify_user", // record a notification request, continue
  "abort", // stop the run
] as const;
export type RecoveryStrategy = (typeof RECOVERY_STRATEGIES)[number];

/** How the trigger reached orchestration. */
export const TRIGGER_SOURCES = ["automation", "manual", "module", "schedule"] as const;
export type TriggerSource = (typeof TRIGGER_SOURCES)[number];

/** Max steps in a single run (guards runaway/circular expansion). */
export const MAX_RUN_STEPS = 15;
/** Max retry attempts for a retry_step strategy. */
export const MAX_STEP_RETRIES = 2;
/** A run that touches at/above this fraction of modules is a "full" orchestration. */
export const FULL_RUN_THRESHOLD = 0.75;

/**
 * The canonical dependency edges: module → the modules that must run AFTER it when it
 * changes. This is the single source of truth for downstream propagation. Timeline +
 * Analytics are terminal sinks (everything can flow into them, they flow nowhere).
 */
export const MODULE_DEPENDENCIES: Record<OrchestrationModule, OrchestrationModule[]> = {
  calendar: ["planner"],
  planner: ["focus", "decision", "notification"],
  focus: ["task", "decision", "health"],
  task: ["decision"],
  // Health feeds Decision + Morning. It informs planner RECOMMENDATIONS only, which is
  // an explicit pipeline step — not a graph edge (that would create a cycle).
  health: ["decision", "morning"],
  finance: ["decision", "notification"],
  goal: ["project", "decision"],
  project: ["task", "decision", "notification"],
  inbox: ["decision", "notification"],
  decision: ["notification", "morning"],
  notification: ["timeline"],
  morning: ["timeline"],
  tomorrow: ["morning", "notification"],
  timeline: ["analytics"],
  analytics: [],
};
