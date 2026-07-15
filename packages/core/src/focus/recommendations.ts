import { HIGH_INTERRUPTION_COUNT } from "./constants";
import { recommendBreak } from "./breaks";
import { isOverrunning } from "./timer";
import type { FocusReadiness, FocusRecommendation, FocusSession } from "./types";

/**
 * Deterministic focus recommendations (Sprint 3.2). A fixed rule set over the active
 * session's timer, interruptions and Health readiness. No AI — every recommendation
 * is a pure function of state, ordered most-urgent first.
 */
export function buildRecommendations(
  session: FocusSession | null,
  now: Date,
  readiness: FocusReadiness | null,
): FocusRecommendation[] {
  const out: FocusRecommendation[] = [];
  if (!session || session.status === "idle") {
    if (readiness && (readiness.level === "low" || readiness.level === "recovery_needed")) {
      out.push({
        id: "start-light",
        title: "Start light",
        detail: readiness.headline,
        action: "take_break",
        tone: "warning",
      });
    } else {
      out.push({
        id: "start-focus",
        title: "Start a focus session",
        detail: "Pick your top planner block and begin deep work.",
        action: "continue",
        tone: "info",
      });
    }
    return out;
  }

  const brk = recommendBreak(session, now, readiness?.score ?? null);
  if (brk.recommend) {
    out.push({
      id: "break",
      title: brk.type === "recovery" ? "Take a recovery break" : "Take a break",
      detail: brk.reason,
      action: brk.type === "recovery" ? "recovery_walk" : "take_break",
      tone: "warning",
    });
  }

  if (session.interruptions.length >= HIGH_INTERRUPTION_COUNT) {
    out.push({
      id: "reduce-interruptions",
      title: "Silence distractions",
      detail: `${session.interruptions.length} interruptions this session — mute notifications to protect your focus.`,
      action: "take_break",
      tone: "warning",
    });
  }

  if (isOverrunning(session, now)) {
    out.push({
      id: "wrap-up",
      title: "Wrap up or extend",
      detail: "You're past the planned length — finish the task or start a fresh block.",
      action: "finish_task",
      tone: "info",
    });
  }

  if (readiness && readiness.hydrationPercent < 40) {
    out.push({
      id: "hydrate",
      title: "Hydrate",
      detail: `Hydration at ${readiness.hydrationPercent}% — a glass of water will help concentration.`,
      action: "hydrate",
      tone: "info",
    });
  }

  if (out.length === 0) {
    out.push({
      id: "in-flow",
      title: "You're in flow",
      detail: "Conditions are good — keep going.",
      action: "continue",
      tone: "success",
    });
  }

  return out;
}
