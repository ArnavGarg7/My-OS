import type {
  OrchestrationModule,
  OrchestrationStatus,
  PipelineKind,
  RecoveryStrategy,
  StepOutcome,
  TriggerSource,
} from "./constants";

/**
 * Orchestration engine types (Sprint 3.5). An orchestration run takes a trigger,
 * expands it into an ordered set of module steps (a pipeline), and records the result
 * of asking each existing service to update. Orchestration references services; it
 * never owns their logic.
 */

/** What starts an orchestration run. */
export interface OrchestrationTrigger {
  id: string;
  pipeline: PipelineKind;
  /** The concrete event that fired it, e.g. "calendar.meeting_added". */
  event: string;
  source: TriggerSource;
  timestamp: string; // ISO
  payload: Record<string, unknown>;
}

/** One step in an execution plan (a module the run will touch). */
export interface ExecutionStep {
  module: OrchestrationModule;
  /** Position in the topological order (0-based). */
  order: number;
  /** Whether this step regenerates schedule/state or only refreshes recommendations. */
  mode: "regenerate" | "refresh" | "recommend" | "record";
  /** Modules this step depends on completing first. */
  dependsOn: OrchestrationModule[];
}

/** The deterministic plan an orchestration produces (never hidden from the user). */
export interface ExecutionPlan {
  pipeline: PipelineKind;
  trigger: string;
  affected: OrchestrationModule[];
  order: ExecutionStep[];
  skipped: OrchestrationModule[];
  summary: string;
}

/** The recorded result of running one step. */
export interface StepResult {
  module: OrchestrationModule;
  outcome: StepOutcome;
  mode: ExecutionStep["mode"];
  runtimeMs: number | null;
  detail?: string;
  /** The recovery strategy applied if this step failed. */
  recovery?: RecoveryStrategy;
}

/** A full run record. */
export interface OrchestrationRun {
  id: string;
  pipeline: PipelineKind;
  trigger: string;
  source: TriggerSource;
  status: OrchestrationStatus;
  startedAt: string; // ISO
  completedAt: string | null;
  runtimeMs: number | null;
  steps: StepResult[];
  affected: OrchestrationModule[];
  skipped: OrchestrationModule[];
  failures: number;
  recoveries: number;
  summary: string;
}

/** A recorded failure + the recovery decision made for it. */
export interface OrchestrationFailure {
  module: OrchestrationModule;
  error: string;
  strategy: RecoveryStrategy;
  recovered: boolean;
}

/** A recovery decision for a failed step (pure). */
export interface RecoveryDecision {
  module: OrchestrationModule;
  strategy: RecoveryStrategy;
  /** Modules to skip as a result (for skip_downstream). */
  skip: OrchestrationModule[];
  reason: string;
}

/** A dependency-graph conflict (e.g. two triggers wanting to regenerate the same module). */
export interface OrchestrationConflict {
  module: OrchestrationModule;
  reason: string;
}

/** Deterministic signals surfaced to the Decision engine. */
export interface OrchestrationSignals {
  healthy: boolean;
  running: boolean;
  recovering: boolean;
  failuresToday: number;
  pendingPipelines: number;
}

/** Compact summary for status bar / context panel / Morning / Tomorrow. */
export interface OrchestrationSummary {
  status: OrchestrationStatus;
  lastRunAt: string | null;
  runsToday: number;
  failuresToday: number;
  recoveriesToday: number;
  affectedModulesLastRun: number;
  systemReady: boolean;
}

/** The context an orchestration run evaluates within (module availability). */
export interface OrchestrationContext {
  now: Date;
  /** Modules currently unavailable — steps for these are skipped/recovered. */
  unavailable: OrchestrationModule[];
}
