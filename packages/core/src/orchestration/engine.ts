import { pipelineForEvent } from "./pipeline";
import { planForTrigger, assembleRun } from "./orchestrator";
import { buildPlan } from "./execution-plan";
import { canProceed, detectConflicts } from "./conflicts";
import { decideRecovery } from "./recovery";
import { scheduleRun } from "./scheduler";
import { validatePlan } from "./validation";
import { buildSummary } from "./selectors";
import { computeSignals } from "./signals";
import type {
  ExecutionPlan,
  OrchestrationContext,
  OrchestrationRun,
  OrchestrationTrigger,
  RecoveryDecision,
  StepResult,
} from "./types";
import type { OrchestrationModule } from "./constants";

/**
 * OrchestrationEngine (Sprint 3.5). The pure coordinator that makes every existing
 * engine cooperate. It resolves a trigger to a pipeline, builds + validates the plan,
 * decides scheduling/conflicts/recovery and assembles the run record from the step
 * results the SERVER produced. It executes nothing and owns no feature logic. Ids +
 * clock are injected for determinism.
 */
export interface OrchestrationEngineDeps {
  newId: () => string;
  now: () => Date;
}

export class OrchestrationEngine {
  constructor(private readonly deps: OrchestrationEngineDeps) {}

  private clock(): Date {
    return this.deps.now();
  }

  /** Build a trigger from an incoming event. */
  makeTrigger(
    event: string,
    source: OrchestrationTrigger["source"],
    payload: Record<string, unknown> = {},
  ): OrchestrationTrigger | null {
    const pipeline = pipelineForEvent(event);
    if (!pipeline) return null;
    return {
      id: this.deps.newId(),
      pipeline,
      event,
      source,
      timestamp: this.clock().toISOString(),
      payload,
    };
  }

  plan(trigger: OrchestrationTrigger, ctx: OrchestrationContext): ExecutionPlan {
    return planForTrigger(trigger, ctx);
  }

  /** Dry-run preview — the plan a trigger WOULD produce (no execution). */
  preview(event: string, ctx: OrchestrationContext): ExecutionPlan | null {
    const pipeline = pipelineForEvent(event);
    if (!pipeline) return null;
    return buildPlan(pipeline, event, ctx);
  }

  validate(plan: ExecutionPlan, history: OrchestrationRun[]) {
    return validatePlan(plan, history);
  }

  schedule(trigger: OrchestrationTrigger, history: OrchestrationRun[]) {
    return scheduleRun(trigger.pipeline, trigger.event, this.clock(), history);
  }

  conflicts(plan: ExecutionPlan, inFlight: ExecutionPlan[]) {
    return detectConflicts(plan, inFlight);
  }

  canProceed(plan: ExecutionPlan, inFlight: ExecutionPlan[]): boolean {
    return canProceed(plan, inFlight);
  }

  recovery(module: OrchestrationModule, plan: ExecutionPlan, attempts: number): RecoveryDecision {
    return decideRecovery(module, plan, attempts);
  }

  assemble(
    trigger: OrchestrationTrigger,
    plan: ExecutionPlan,
    steps: StepResult[],
    startedAt: Date,
  ): OrchestrationRun {
    return assembleRun(this.deps.newId(), trigger, plan, steps, startedAt, this.clock());
  }

  summary(history: OrchestrationRun[], timezone: string) {
    return buildSummary(history, this.clock(), timezone);
  }

  signals(history: OrchestrationRun[], timezone: string, pendingPipelines: number) {
    return computeSignals({ history, now: this.clock(), timezone, pendingPipelines });
  }
}

export function createOrchestrationEngine(
  newId: () => string,
  now: () => Date = () => new Date(),
): OrchestrationEngine {
  return new OrchestrationEngine({ newId, now });
}
