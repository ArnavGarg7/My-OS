/**
 * Adaptive workload realism (Stage 5, spec §Adaptive Planning). A pure,
 * deterministic assessment of whether a day's plan is realistic given the user's
 * available time, committed meetings, and — crucially — their OWN historical
 * completion rate and estimation bias. It never rearranges the plan: it detects
 * overload and proposes explainable deferrals for the user to approve. Evidence
 * first — with no history it falls back to raw capacity and says so. No AI.
 */
import type { Confidence } from "./types";
import { computeConfidence } from "./confidence";

export interface WorkloadTask {
  id: string;
  title: string;
  /** Priority weight, higher = more important (defer the lowest first). */
  priorityWeight: number;
  /** The user's estimate in minutes (or a default when absent). */
  estimateMinutes: number;
}

export interface WorkloadInput {
  tasks: WorkloadTask[];
  /** Working minutes available today (from working hours). */
  availableMinutes: number;
  /** Minutes already committed to meetings/events today. */
  meetingMinutes: number;
  /** Historical share of planned work actually completed, 0..1, or null if unknown. */
  completionRate: number | null;
  /** How many days of history back the completion rate (for confidence). */
  completionSampleDays: number;
  /** Estimate→actual adjustment (from estimation learning); 1 = trust estimates. */
  estimateAdjustment: number;
}

export interface WorkloadAssessment {
  plannedMinutes: number;
  /** Planned minutes after applying the learned estimation bias. */
  expectedMinutes: number;
  freeMinutes: number;
  /** Realistically completable minutes = free × completionRate (or free when unknown). */
  realisticCapacityMinutes: number;
  overloaded: boolean;
  /** Minutes over capacity (0 when not overloaded). */
  overBy: number;
  /** Lowest-priority tasks to move so the day fits, in defer order. */
  deferSuggestions: { id: string; title: string; estimateMinutes: number }[];
  reasons: string[];
  confidence: Confidence;
  headline: string;
}

/** Assess today's plan for realism. Deterministic given its inputs. */
export function assessWorkload(input: WorkloadInput): WorkloadAssessment {
  const plannedMinutes = input.tasks.reduce((s, t) => s + Math.max(0, t.estimateMinutes), 0);
  const expectedMinutes = Math.round(plannedMinutes * (input.estimateAdjustment || 1));
  const freeMinutes = Math.max(0, input.availableMinutes - input.meetingMinutes);
  const rate = input.completionRate;
  const realisticCapacityMinutes = Math.round(rate === null ? freeMinutes : freeMinutes * rate);

  const reasons: string[] = [];
  reasons.push(`${input.tasks.length} task${input.tasks.length === 1 ? "" : "s"} planned`);
  if (input.meetingMinutes > 0) reasons.push(`${input.meetingMinutes}m of meetings`);
  reasons.push(`${freeMinutes}m free of ${input.availableMinutes}m today`);
  if (expectedMinutes !== plannedMinutes) {
    reasons.push(
      `~${expectedMinutes}m expected (your estimates run ${Math.round(input.estimateAdjustment * 100)}% of stated)`,
    );
  }
  if (rate !== null)
    reasons.push(`you typically complete ${Math.round(rate * 100)}% of a day's plan`);

  const overBy = Math.max(0, expectedMinutes - realisticCapacityMinutes);
  const overloaded = overBy > 0 && input.tasks.length > 0;

  // Defer the lowest-priority tasks until the expected load fits the realistic capacity.
  const deferSuggestions: WorkloadAssessment["deferSuggestions"] = [];
  if (overloaded) {
    const byPriorityAsc = [...input.tasks].sort((a, b) => a.priorityWeight - b.priorityWeight);
    let load = expectedMinutes;
    for (const t of byPriorityAsc) {
      if (load <= realisticCapacityMinutes) break;
      deferSuggestions.push({ id: t.id, title: t.title, estimateMinutes: t.estimateMinutes });
      load -= Math.round(t.estimateMinutes * (input.estimateAdjustment || 1));
    }
  }

  const confidence: Confidence =
    rate === null
      ? {
          level: "low",
          score: 0.3,
          reasons: ["based on today's capacity only — not enough completion history yet"],
        }
      : computeConfidence({
          observations: Math.max(3, Math.round(input.completionSampleDays)),
          consistency: 0.7,
          timeSpanDays: input.completionSampleDays,
          contradictions: 0,
          recencyDays: 0,
        });

  const headline = overloaded
    ? `Today looks overloaded by about ${overBy} min`
    : input.tasks.length === 0
      ? "Nothing planned yet"
      : "Today's plan looks realistic";

  return {
    plannedMinutes,
    expectedMinutes,
    freeMinutes,
    realisticCapacityMinutes,
    overloaded,
    overBy,
    deferSuggestions,
    reasons,
    confidence,
    headline,
  };
}
