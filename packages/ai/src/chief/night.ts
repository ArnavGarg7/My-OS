/**
 * Night Planning (Sprint 5.2). A guided flow that closes today and drafts tomorrow, ending in a
 * PLANNER PROPOSAL (never applied until confirmed). Deterministic given the context:
 *   1. Today's review (done / missed)
 *   2. Tomorrow's fixed events
 *   3. Incomplete tasks to carry forward
 *   4. A generated draft (the proposal)
 *   5. Confirmation (the user accepts).
 */
import { confidenceFor } from "./confidence";
import type { ChiefContext, PlanChange, PlannerProposal } from "./types";

export interface NightReview {
  completed: string[];
  missed: string[];
  carryForward: { id: string; title: string }[];
}

export interface NightPlan {
  review: NightReview;
  tomorrowEvents: { title: string; start: string }[];
  proposal: PlannerProposal;
}

/** Step 1–3: review today and gather carry-forward. */
export function nightReview(ctx: ChiefContext): NightReview {
  const completed = ctx.planBlocks.filter((b) => b.status === "done").map((b) => b.title);
  const missed = ctx.planBlocks
    .filter((b) => b.status === "missed" || b.status === "skipped")
    .map((b) => b.title);
  const carryForward = ctx.tasks
    .filter((t) => t.status !== "done")
    .slice(0, 8)
    .map((t) => ({ id: t.id, title: t.title }));
  return { completed, missed, carryForward };
}

/** Step 4: draft tomorrow — a proposal that schedules carry-forward work around tomorrow's events. */
export function buildNightPlan(ctx: ChiefContext): NightPlan {
  const review = nightReview(ctx);
  const tomorrowEvents = [...ctx.calendarEvents]
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .map((e) => ({ title: e.title, start: e.start }));

  const changes: PlanChange[] = review.carryForward.slice(0, 5).map((t) => ({
    kind: "add",
    title: t.title,
    to: "tomorrow",
    reason: "Carry forward incomplete work into tomorrow's plan.",
  }));
  if (review.missed.length > 0) {
    changes.push({
      kind: "add",
      title: `Reschedule: ${review.missed[0]}`,
      to: "tomorrow",
      reason: "You missed this today — give it a slot tomorrow.",
    });
  }

  const proposal: PlannerProposal = {
    kind: "night",
    changes,
    summary: `Tomorrow's draft: ${changes.length} block(s) around ${tomorrowEvents.length} event(s).`,
    rationale: "Close today and set up tomorrow so you wake up to a plan, not a blank page.",
    confidence: confidenceFor(ctx),
  };
  return { review, tomorrowEvents, proposal };
}
