import {
  CONTEXT_SWITCH_PENALTY,
  CONTEXT_SWITCH_TOLERANCE,
  DEEP_WORK_TARGET_MINUTES,
  FOCUS_BLOCK_TARGET,
  FOCUS_WEIGHTS,
  PRODUCTIVITY_WEIGHTS,
} from "./constants";
import { clampScore, countKind, mean, metaNumber, pct, round, sumMeta } from "./metrics";
import type { FocusMetrics, ProductivityMetrics } from "./types";
import type { PlannerAnalyticsInput } from "./types";
import type { TimelineEvent } from "../timeline";

/**
 * Productivity engine (Sprint 2.14). Derives a deterministic 0–100 productivity
 * score from task completion, planner adherence, deep work and decision
 * completion, with a penalty for excessive context switching. Reads the Timeline
 * event stream (already windowed by the caller) + an optional planner snapshot.
 */
export function computeProductivity(
  events: TimelineEvent[],
  planner?: PlannerAnalyticsInput,
): ProductivityMetrics {
  const tasksCompleted = countKind(events, "task.completed");
  const tasksCreated = countKind(events, "task.created");
  const decisionsCompleted = countKind(events, "decision.accepted");
  const deepWorkMinutes = sumMeta(events, "focusMinutes");
  const contextSwitches = sumMeta(events, "contextSwitches");
  const focusBlocks = events.filter((e) => metaNumber(e, "focusMinutes") !== null).length;

  const executionTimes = events
    .map((e) => metaNumber(e, "executionMinutes"))
    .filter((n): n is number => n !== null);
  const avgExecutionMinutes = round(mean(executionTimes), 1);

  const plannerCompletion = planner
    ? clampScore(planner.accuracy)
    : pct(tasksCompleted, tasksCompleted + tasksCreated);

  // Sub-scores (0–100).
  const taskScore = pct(tasksCompleted, Math.max(1, tasksCompleted + tasksCreated));
  const deepWorkScore = clampScore((deepWorkMinutes / DEEP_WORK_TARGET_MINUTES) * 100);
  const decisionScore = decisionsCompleted > 0 ? clampScore(50 + decisionsCompleted * 10) : 0;

  let score =
    taskScore * PRODUCTIVITY_WEIGHTS.taskCompletion +
    plannerCompletion * PRODUCTIVITY_WEIGHTS.plannerAdherence +
    deepWorkScore * PRODUCTIVITY_WEIGHTS.deepWork +
    decisionScore * PRODUCTIVITY_WEIGHTS.decisionCompletion;

  // Context-switch penalty.
  const overSwitches = Math.max(0, contextSwitches - CONTEXT_SWITCH_TOLERANCE);
  score -= overSwitches * CONTEXT_SWITCH_PENALTY;

  return {
    tasksCompleted,
    tasksCreated,
    plannerCompletion,
    deepWorkMinutes,
    contextSwitches,
    focusBlocks,
    decisionsCompleted,
    avgExecutionMinutes,
    score: clampScore(score),
  };
}

/**
 * Focus engine (Sprint 2.14). A 0–100 focus score from deep-work volume, number
 * of focus blocks and continuity (fewer context switches → higher continuity).
 */
export function computeFocus(events: TimelineEvent[]): FocusMetrics {
  const blockMinutes = events
    .map((e) => metaNumber(e, "focusMinutes"))
    .filter((n): n is number => n !== null);
  const deepWorkMinutes = blockMinutes.reduce((a, b) => a + b, 0);
  const focusBlocks = blockMinutes.length;
  const contextSwitches = sumMeta(events, "contextSwitches");
  const longestBlockMinutes = blockMinutes.length ? Math.max(...blockMinutes) : 0;

  const deepWorkScore = clampScore((deepWorkMinutes / DEEP_WORK_TARGET_MINUTES) * 100);
  const blockScore = clampScore((focusBlocks / FOCUS_BLOCK_TARGET) * 100);
  const overSwitches = Math.max(0, contextSwitches - CONTEXT_SWITCH_TOLERANCE);
  const continuityScore = clampScore(100 - overSwitches * CONTEXT_SWITCH_PENALTY);

  // With no deep-work blocks there is no focus to score — continuity alone is
  // meaningless, so the score is zero.
  const score =
    focusBlocks === 0
      ? 0
      : clampScore(
          deepWorkScore * FOCUS_WEIGHTS.deepWork +
            blockScore * FOCUS_WEIGHTS.blocks +
            continuityScore * FOCUS_WEIGHTS.continuity,
        );

  return { deepWorkMinutes, focusBlocks, contextSwitches, longestBlockMinutes, score };
}
