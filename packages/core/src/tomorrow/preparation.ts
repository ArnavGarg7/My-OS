import { STUDIO_STEPS, type StudioStep } from "./constants";
import type { ChecklistProgress, PrioritySelection, TomorrowReadiness } from "./types";

/**
 * Preparation engine (Sprint 3.1). Tracks the guided workflow: which step is
 * active, whether a step is satisfied, and overall progress. Deterministic gate
 * logic — finalisation requires priorities + required checklist items.
 */
export function nextStep(step: StudioStep): StudioStep | null {
  const i = STUDIO_STEPS.indexOf(step);
  return i >= 0 && i < STUDIO_STEPS.length - 1 ? STUDIO_STEPS[i + 1]! : null;
}

export function previousStep(step: StudioStep): StudioStep | null {
  const i = STUDIO_STEPS.indexOf(step);
  return i > 0 ? STUDIO_STEPS[i - 1]! : null;
}

export function stepIndex(step: StudioStep): number {
  return STUDIO_STEPS.indexOf(step);
}

/** 0–100 progress through the guided flow. */
export function studioProgress(step: StudioStep): number {
  return Math.round((stepIndex(step) / (STUDIO_STEPS.length - 1)) * 100);
}

/** Whether the plan can be finalised. */
export function canFinalize(
  priorities: PrioritySelection | { top: unknown[] },
  checklist: ChecklistProgress,
): boolean {
  const hasPriorities = (priorities.top?.length ?? 0) > 0;
  return hasPriorities && checklist.allRequiredDone;
}

/** Whether tomorrow is "ready" (finalisable + a healthy readiness score). */
export function isReady(canFinalizeNow: boolean, readiness: TomorrowReadiness): boolean {
  return canFinalizeNow && readiness.score > 0;
}
