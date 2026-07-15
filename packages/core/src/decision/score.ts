import { PRIORITY_WEIGHT } from "./constants";
import { withinWorkingHours } from "./rules";
import { minutesUntil } from "./scheduler";
import type { Decision, DecisionContext, ScoreComponent, ScoreResult } from "./types";

/**
 * Decision scoring (Sprint 2.3). A deterministic 0–100 score from priority +
 * urgency + time sensitivity + remaining hours + focus window + energy. Returns
 * the breakdown so the explainer can show exactly how it was computed.
 */
function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreDecision(decision: Decision, ctx: DecisionContext): ScoreResult {
  const breakdown: ScoreComponent[] = [];
  const push = (label: string, value: number) => {
    if (value !== 0) breakdown.push({ label, value });
  };

  const base = PRIORITY_WEIGHT[decision.priority];
  push(`Priority · ${decision.priority}`, base);
  let score = base;

  const expiryMins = minutesUntil(decision.expiresAt, ctx.now);
  if (expiryMins !== null && expiryMins >= 0 && expiryMins < 60) {
    score += 8;
    push("Expiring soon", 8);
  }

  if (withinWorkingHours(ctx) && (decision.type === "focus" || decision.type === "mission")) {
    score += 6;
    push("Within working hours", 6);
  }

  if (ctx.snapshot.remainingDay.percentRemaining < 30) {
    score += 4;
    push("Little time remaining", 4);
  }

  if (ctx.snapshot.productiveWindow.active) {
    score += 4;
    push("Focus window active", 4);
  }

  if (ctx.state?.energyLevel === "high" && decision.type === "focus") {
    score += 5;
    push("High energy fits focus", 5);
  }
  if (ctx.state?.energyLevel === "low" && decision.type === "health") {
    score += 5;
    push("Low energy fits recovery", 5);
  }

  return { score: clamp(score), breakdown };
}
