/**
 * Explainability Engine (Sprint 5.2, 06_AI_Architecture §9). Every recommendation answers "why?"
 * with the decision grammar: situation → recommendation → alternatives → cost of ignoring →
 * confidence. The FACTS and NUMBERS are deterministic (built here from the context); a provider may
 * later rephrase the copy, but never computes the reasoning. Never "because the AI thinks so."
 */
import type { Alternative, ChiefContext, ConfidenceLevel, Explanation } from "./types";
import { bestFocusWindow } from "./signals";

export interface ExplanationParts {
  situation: string;
  recommendation: string;
  alternatives: Alternative[];
  costOfIgnoring: string;
  confidence: ConfidenceLevel;
}

/** Assemble a structured Explanation. Deterministic, grounded, never vague. */
export function buildExplanation(parts: ExplanationParts): Explanation {
  return {
    situation: parts.situation,
    recommendation: parts.recommendation,
    alternatives: parts.alternatives.map((a) => a.title),
    costOfIgnoring: parts.costOfIgnoring,
    confidence: parts.confidence,
  };
}

/** A grounded situation sentence from the context (energy, windows, meetings). */
export function situationSentence(ctx: ChiefContext): string {
  const window = bestFocusWindow(ctx);
  const bits: string[] = [];
  if (ctx.energy) bits.push(`energy is ${ctx.energy}`);
  if (window)
    bits.push(`${window.minutes} ${window.uninterrupted ? "uninterrupted " : ""}minutes are free`);
  const meetings = ctx.calendarEvents.length;
  if (meetings > 0) bits.push(`${meetings} meeting${meetings === 1 ? "" : "s"} scheduled`);
  if (bits.length === 0) return "Your day is open.";
  return capitalize(bits.join(", ")) + ".";
}
function capitalize(s: string): string {
  return s.length ? s[0]!.toUpperCase() + s.slice(1) : s;
}
