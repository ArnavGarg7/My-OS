/**
 * Morning Intelligence (Sprint 5.2). Extends the deterministic Morning Briefing into an actionable
 * morning: today's mission, the Now recommendation, biggest risk, top opportunity, the focus window,
 * a preparation checklist, and confidence. Every field is grounded in the read models the composer
 * supplied — nothing is invented.
 */
import { confidenceFor } from "./confidence";
import { nowRecommendation } from "./recommendation";
import { bestFocusWindow, biggestRisk, minutesBetween, topOpportunity } from "./signals";
import type { ChiefContext, MorningIntelligence } from "./types";

/** Build the morning intelligence for the day. */
export function morningIntelligence(ctx: ChiefContext): MorningIntelligence {
  const greeting = `Good morning, ${ctx.greetingName}`;
  const checklist = preparationChecklist(ctx);
  return {
    greeting,
    readiness: ctx.readiness,
    mission: ctx.mission.priorities,
    recommendation: nowRecommendation(ctx),
    biggestRisk: biggestRisk(ctx),
    opportunity: topOpportunity(ctx),
    focusWindow: bestFocusWindow(ctx),
    preparationChecklist: checklist,
    confidence: confidenceFor(ctx),
  };
}

/** A grounded prep checklist: upcoming meetings needing prep + the day's top task. */
export function preparationChecklist(ctx: ChiefContext): string[] {
  const items: string[] = [];
  const soon = [...ctx.calendarEvents]
    .filter((e) => new Date(e.start).getTime() >= new Date(ctx.now).getTime())
    .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
    .slice(0, 2);
  for (const e of soon) {
    const mins = minutesBetween(ctx.now, e.start);
    items.push(`Prepare for "${e.title}"${mins > 0 ? ` (in ${mins} min)` : ""}.`);
  }
  const top = ctx.tasks.find((t) => t.status !== "done");
  if (top) items.push(`Set up your first focus block for "${top.title}".`);
  if (ctx.pendingDecisions > 0) items.push(`Clear ${ctx.pendingDecisions} pending decision(s).`);
  return items;
}
