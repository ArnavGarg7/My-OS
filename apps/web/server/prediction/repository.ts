import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  predictionConfidence,
  predictionFeatures,
  predictionMetrics,
  predictionScenarios,
  predictions as predictionsTable,
} from "@myos/db/schema";
import type { Prediction, ScenarioResult } from "@myos/core/prediction";

/**
 * Prediction repository (Sprint 6.2). Persists immutable predictions + their confidence, features and
 * run metrics, and records scenario simulations. A new forecast run supersedes prior active
 * predictions of the same dedupeKey — predictions are never edited in place.
 */

function rowToPrediction(
  r: typeof predictionsTable.$inferSelect,
  conf: { level: string; score: number; reasons: string[] } | null,
): Prediction {
  return {
    id: r.id,
    kind: r.kind as Prediction["kind"],
    outlook: r.outlook as Prediction["outlook"],
    metrics: r.metrics,
    horizonDays: r.horizonDays,
    targetDate: r.targetDate ? r.targetDate.toISOString() : null,
    trend: (r.trend as Prediction["trend"]) ?? null,
    confidence: conf
      ? {
          level: conf.level as Prediction["confidence"]["level"],
          score: conf.score,
          reasons: conf.reasons,
        }
      : { level: "low", score: 0, reasons: [] },
    explanation: r.explanation,
    relatedObjects: r.relatedObjects,
    createdAt: r.createdAt.toISOString(),
    dedupeKey: r.dedupeKey,
  };
}

/** Persist a forecast run: supersede prior actives, insert the new immutable predictions + metrics. */
export async function recordRun(
  db: Database,
  predictions: readonly Prediction[],
  counts: { total: number; risks: number; opportunities: number; onTrack: number },
): Promise<void> {
  await db
    .update(predictionsTable)
    .set({ status: "superseded" })
    .where(eq(predictionsTable.status, "active"));
  for (const p of predictions) {
    const [row] = await db
      .insert(predictionsTable)
      .values({
        kind: p.kind,
        outlook: p.outlook,
        metrics: p.metrics,
        horizonDays: p.horizonDays,
        targetDate: p.targetDate ? new Date(p.targetDate) : null,
        trend: (p.trend ?? null) as Record<string, unknown> | null,
        explanation: p.explanation,
        relatedObjects: p.relatedObjects,
        dedupeKey: p.dedupeKey,
        status: "active",
      })
      .returning({ id: predictionsTable.id });
    const id = row!.id;
    await db.insert(predictionConfidence).values({
      predictionId: id,
      level: p.confidence.level,
      score: p.confidence.score,
      reasons: p.confidence.reasons,
    });
    await db.insert(predictionFeatures).values({ predictionId: id, features: p.metrics });
  }
  await db.insert(predictionMetrics).values(counts);
}

/** Load the current active predictions (newest run). */
export async function loadActive(db: Database): Promise<Prediction[]> {
  const rows = await db
    .select()
    .from(predictionsTable)
    .where(eq(predictionsTable.status, "active"))
    .orderBy(desc(predictionsTable.createdAt));
  const out: Prediction[] = [];
  for (const r of rows) {
    const [conf] = await db
      .select()
      .from(predictionConfidence)
      .where(eq(predictionConfidence.predictionId, r.id))
      .limit(1);
    out.push(
      rowToPrediction(
        r,
        conf ? { level: conf.level, score: conf.score, reasons: conf.reasons } : null,
      ),
    );
  }
  return out;
}

/** Recent predictions (any status) for history. */
export async function listHistory(db: Database, limit = 50): Promise<Prediction[]> {
  const rows = await db
    .select()
    .from(predictionsTable)
    .orderBy(desc(predictionsTable.createdAt))
    .limit(limit);
  return rows.map((r) => rowToPrediction(r, null));
}

/** Record a scenario simulation (audit; never mutates plans). */
export async function recordScenario(
  db: Database,
  predictionId: string | null,
  result: ScenarioResult,
): Promise<void> {
  await db.insert(predictionScenarios).values({
    predictionId,
    scenario: result.scenario,
    effects: result.effects,
    netDelta: result.netDelta,
    confidence: result.confidence,
  });
}
