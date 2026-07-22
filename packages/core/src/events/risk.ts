/**
 * Risk Detection (Sprint 6.1). Deterministic detectors that turn a snapshot of the user's situation
 * into risk Signals (spec §Risk Detection). Pure — the server assembles the context from frozen
 * module read models and passes `now` + an id factory. No AI.
 */
import type { Signal } from "./types";
import { WINDOW_EXPIRY_HOURS } from "./constants";

export interface RiskContext {
  /** Deadlines with no recent progress. */
  deadlines: {
    id: string;
    label: string;
    daysRemaining: number;
    estimateHours: number;
    availableHours: number;
  }[];
  /** Latest readiness (0..100) or null. */
  readiness: number | null;
  /** Meetings scheduled today. */
  meetingsToday: number;
  /** Consecutive days without a workout. */
  daysSinceWorkout: number;
  /** Upcoming exams/assessments. */
  exams: { id: string; label: string; daysRemaining: number; prepared: boolean }[];
}

export interface DetectDeps {
  newId: () => string;
  now: Date;
}

function mk(
  deps: DetectDeps,
  over: Pick<
    Signal,
    "category" | "severity" | "confidence" | "window" | "explanation" | "dedupeKey"
  > &
    Partial<Pick<Signal, "relatedObjects" | "source">>,
): Signal {
  const window = over.window;
  const expiryHours = WINDOW_EXPIRY_HOURS[window];
  const createdAt = deps.now.toISOString();
  return {
    id: deps.newId(),
    source: over.source ?? "external",
    category: over.category,
    severity: over.severity,
    confidence: over.confidence,
    createdAt,
    expiresAt:
      expiryHours === null
        ? null
        : new Date(deps.now.getTime() + expiryHours * 3_600_000).toISOString(),
    window,
    explanation: over.explanation,
    relatedObjects: over.relatedObjects ?? [],
    eventIds: [],
    status: "active",
    dedupeKey: over.dedupeKey,
  };
}

/** Detect all risks in a context snapshot. Deterministic + explainable. */
export function detectRisks(ctx: RiskContext, deps: DetectDeps): Signal[] {
  const out: Signal[] = [];

  for (const d of ctx.deadlines) {
    if (d.estimateHours > d.availableHours && d.daysRemaining >= 0) {
      out.push(
        mk(deps, {
          source: "task",
          category: "risks",
          severity: d.daysRemaining <= 2 ? "critical" : "high",
          confidence: 0.8,
          window: d.daysRemaining <= 1 ? "today" : "week",
          dedupeKey: `task:risks:deadline:${d.id}`,
          relatedObjects: [{ module: "task", id: d.id, label: d.label }],
          explanation: {
            headline: "Deadline risk",
            reasons: [
              "No progress recorded",
              `${d.daysRemaining} day${d.daysRemaining === 1 ? "" : "s"} remaining`,
              `Estimated work (${d.estimateHours}h) exceeds available time (${d.availableHours}h)`,
            ],
            implication: "This will slip unless deliberately scheduled.",
          },
        }),
      );
    }
  }

  if (ctx.readiness !== null && ctx.readiness < 40) {
    out.push(
      mk(deps, {
        source: "health",
        category: "risks",
        severity: ctx.readiness < 25 ? "critical" : "high",
        confidence: 0.8,
        window: "current",
        dedupeKey: "health:risks:burnout",
        explanation: {
          headline: "Burnout risk",
          reasons: [`Readiness is ${ctx.readiness}`, "Sustained low recovery"],
          implication: "Reduce load and prioritise recovery today.",
        },
      }),
    );
  }

  if (ctx.meetingsToday >= 5) {
    out.push(
      mk(deps, {
        source: "calendar",
        category: "risks",
        severity: "medium",
        confidence: 0.7,
        window: "today",
        dedupeKey: "calendar:risks:focus",
        explanation: {
          headline: "Focus risk",
          reasons: [`${ctx.meetingsToday} meetings today`, "Little uninterrupted time"],
          implication: "Deep work may be squeezed out — protect a block.",
        },
      }),
    );
  }

  if (ctx.daysSinceWorkout >= 4) {
    out.push(
      mk(deps, {
        source: "health",
        category: "risks",
        severity: "low",
        confidence: 0.65,
        window: "week",
        dedupeKey: "health:risks:consistency",
        explanation: {
          headline: "Health consistency risk",
          reasons: [`${ctx.daysSinceWorkout} days since your last workout`],
          implication: "Consistency is slipping — a short session helps.",
        },
      }),
    );
  }

  for (const ex of ctx.exams) {
    if (!ex.prepared && ex.daysRemaining <= 7 && ex.daysRemaining >= 0) {
      out.push(
        mk(deps, {
          source: "knowledge",
          category: "risks",
          severity: ex.daysRemaining <= 2 ? "high" : "medium",
          confidence: 0.75,
          window: ex.daysRemaining <= 1 ? "today" : "week",
          dedupeKey: `knowledge:risks:prep:${ex.id}`,
          relatedObjects: [{ module: "knowledge", id: ex.id, label: ex.label }],
          explanation: {
            headline: "Preparation risk",
            reasons: [`"${ex.label}" in ${ex.daysRemaining} days`, "Preparation incomplete"],
            implication: "Start structured prep now to avoid cramming.",
          },
        }),
      );
    }
  }

  return out;
}
