/**
 * Opportunity Detection (Sprint 6.1). Deterministic detectors that turn a situation snapshot into
 * opportunity Signals (spec §Opportunity Detection). Pure; shares the DetectDeps/mk shape with
 * [[risk]]. No AI.
 */
import type { Signal } from "./types";
import { WINDOW_EXPIRY_HOURS } from "./constants";
import type { DetectDeps } from "./risk";

export interface OpportunityContext {
  /** A freed contiguous block (e.g. from a cancellation), in minutes. */
  freedMinutes: number;
  /** Whether an assignment/task finished ahead of schedule. */
  earlyCompletion: { id: string; label: string } | null;
  /** Latest readiness (0..100) or null. */
  readiness: number | null;
  /** An unexpectedly free evening. */
  freeEvening: boolean;
  /** A stalled project that could be resumed. */
  resumableProject: { id: string; label: string } | null;
}

function mk(
  deps: DetectDeps,
  over: Pick<
    Signal,
    "category" | "severity" | "confidence" | "window" | "explanation" | "dedupeKey"
  > &
    Partial<Pick<Signal, "relatedObjects" | "source">>,
): Signal {
  const expiryHours = WINDOW_EXPIRY_HOURS[over.window];
  return {
    id: deps.newId(),
    source: over.source ?? "external",
    category: over.category,
    severity: over.severity,
    confidence: over.confidence,
    createdAt: deps.now.toISOString(),
    expiresAt:
      expiryHours === null
        ? null
        : new Date(deps.now.getTime() + expiryHours * 3_600_000).toISOString(),
    window: over.window,
    explanation: over.explanation,
    relatedObjects: over.relatedObjects ?? [],
    eventIds: [],
    status: "active",
    dedupeKey: over.dedupeKey,
  };
}

/** Detect all opportunities in a context snapshot. Deterministic + explainable. */
export function detectOpportunities(ctx: OpportunityContext, deps: DetectDeps): Signal[] {
  const out: Signal[] = [];

  if (ctx.freedMinutes >= 45) {
    out.push(
      mk(deps, {
        source: "calendar",
        category: "opportunities",
        severity: "medium",
        confidence: 0.85,
        window: "today",
        dedupeKey: "calendar:opportunities:free_window",
        explanation: {
          headline: `${ctx.freedMinutes}-minute focus block available`,
          reasons: [
            `${ctx.freedMinutes} minutes just opened up`,
            "Enough for a real deep-work session",
          ],
          implication: "Protect it for your highest-priority work.",
        },
      }),
    );
  }

  if (ctx.earlyCompletion) {
    out.push(
      mk(deps, {
        source: "task",
        category: "opportunities",
        severity: "low",
        confidence: 0.8,
        window: "today",
        dedupeKey: `task:opportunities:early:${ctx.earlyCompletion.id}`,
        relatedObjects: [
          { module: "task", id: ctx.earlyCompletion.id, label: ctx.earlyCompletion.label },
        ],
        explanation: {
          headline: "Extra learning opportunity",
          reasons: [`Finished "${ctx.earlyCompletion.label}" early`, "Time freed vs. your plan"],
          implication: "A good window to get ahead on learning or the next priority.",
        },
      }),
    );
  }

  if (ctx.readiness !== null && ctx.readiness >= 75) {
    out.push(
      mk(deps, {
        source: "health",
        category: "opportunities",
        severity: "low",
        confidence: 0.8,
        window: "current",
        dedupeKey: "health:opportunities:deep_work",
        explanation: {
          headline: "Deep work recommended",
          reasons: [`Readiness is ${ctx.readiness}`, "You're well recovered"],
          implication: "Spend this energy on your most demanding task.",
        },
      }),
    );
  }

  if (ctx.freeEvening && ctx.resumableProject) {
    out.push(
      mk(deps, {
        source: "project",
        category: "opportunities",
        severity: "low",
        confidence: 0.7,
        window: "today",
        dedupeKey: `project:opportunities:resume:${ctx.resumableProject.id}`,
        relatedObjects: [
          { module: "project", id: ctx.resumableProject.id, label: ctx.resumableProject.label },
        ],
        explanation: {
          headline: "Resume a stalled project",
          reasons: [
            "An unexpectedly free evening",
            `"${ctx.resumableProject.label}" has had no recent activity`,
          ],
          implication: "A chance to rebuild momentum.",
        },
      }),
    );
  }

  return out;
}
