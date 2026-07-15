import type { SessionType } from "./constants";

/**
 * Focus target selection (Sprint 3.2). Given the candidate work already produced by
 * the Planner and Task engines, pick what to focus on next. Focus owns NO scheduling
 * — it only reads candidates and orders them deterministically. It never creates,
 * reorders or mutates planner blocks or tasks.
 */
export interface FocusCandidate {
  taskId: string | null;
  plannerBlockId: string | null;
  projectId: string | null;
  title: string;
  /** From the source engine: a planner block's start (ISO) if any. */
  scheduledFor: string | null;
  /** Task priority score (higher = more important), if from a task. */
  priorityScore: number;
  /** True when the source is a calendar meeting block — cannot be focused. */
  isMeeting: boolean;
  /** Estimated minutes, if known. */
  estimateMinutes: number | null;
}

export interface FocusSuggestion {
  candidate: FocusCandidate;
  type: SessionType;
  plannedMinutes: number;
  reason: string;
}

const DEFAULT_MINUTES = 50;

function suggestType(candidate: FocusCandidate): SessionType {
  if (candidate.isMeeting) return "meeting";
  if ((candidate.estimateMinutes ?? DEFAULT_MINUTES) >= 45 && candidate.priorityScore >= 6) {
    return "deep_work";
  }
  return "focus";
}

/**
 * Order candidates: scheduled-soonest first (planner blocks anchor the day), then by
 * priority, then by title for a stable order. Meetings sort with everything else but
 * are marked non-focusable by the caller.
 */
export function orderCandidates(candidates: FocusCandidate[]): FocusCandidate[] {
  return [...candidates].sort((a, b) => {
    const at = a.scheduledFor ? Date.parse(a.scheduledFor) : Number.POSITIVE_INFINITY;
    const bt = b.scheduledFor ? Date.parse(b.scheduledFor) : Number.POSITIVE_INFINITY;
    if (at !== bt) return at - bt;
    if (b.priorityScore !== a.priorityScore) return b.priorityScore - a.priorityScore;
    return a.title.localeCompare(b.title);
  });
}

/** Pick the single best next focusable candidate (skips meetings). */
export function selectNext(candidates: FocusCandidate[]): FocusSuggestion | null {
  const focusable = orderCandidates(candidates).filter((c) => !c.isMeeting);
  const top = focusable[0];
  if (!top) return null;
  const plannedMinutes = Math.max(1, top.estimateMinutes ?? DEFAULT_MINUTES);
  const reason = top.scheduledFor ? "Next up on your planner." : "Highest-priority open work.";
  return { candidate: top, type: suggestType(top), plannedMinutes, reason };
}
