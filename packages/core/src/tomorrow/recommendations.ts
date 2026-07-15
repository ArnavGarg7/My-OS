import type {
  CarryForwardList,
  DayReview,
  TomorrowReadiness,
  TomorrowRecommendation,
  TomorrowSignals,
} from "./types";

/**
 * Recommendation engine (Sprint 3.1). Deterministic, rule-derived guidance for
 * the finalize step — no AI text. Each recommendation follows directly from the
 * review, carry-forward load, readiness and signals.
 */
export function buildRecommendations(
  review: DayReview,
  carryForward: CarryForwardList,
  readiness: TomorrowReadiness,
  signals: TomorrowSignals,
): TomorrowRecommendation[] {
  const out: TomorrowRecommendation[] = [];
  const push = (id: string, title: string, detail: string, tone: TomorrowRecommendation["tone"]) =>
    out.push({ id, title, detail, tone });

  if (signals.tooMuchUnfinished) {
    push(
      "reduce-workload",
      "Reduce tomorrow's workload",
      `${carryForward.total} items are carrying forward — pick the vital few.`,
      "warning",
    );
  }
  if (signals.heavyMeetingDay) {
    push(
      "protect-focus",
      "Schedule deep work early",
      `${readiness.meetingMinutes} minutes of meetings — protect a morning focus block.`,
      "warning",
    );
  }
  if (signals.lowReadiness) {
    push(
      "lower-intensity",
      "Lower tomorrow's intensity",
      readiness.recoveryRecommendation,
      "warning",
    );
  }
  if (review.completionScore >= 80) {
    push(
      "strong-day",
      "Strong day — keep the momentum",
      "You closed out most of today's plan; carry the energy into tomorrow.",
      "success",
    );
  }
  if (!review.journalCompleted) {
    push("journal", "Write today's reflection", "A short journal entry closes the loop.", "info");
  }
  if (out.length === 0) {
    push(
      "balanced",
      "Tomorrow looks balanced",
      "A healthy plan — protect your focus windows.",
      "success",
    );
  }
  return out;
}
