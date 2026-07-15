import "server-only";
import { todayInTimeZone } from "@myos/core/today";
import type { Database } from "@myos/db";
import { buildContext } from "./service";
import { buildDayReview } from "@myos/core/tomorrow";
import * as repo from "./repository";

/**
 * Tomorrow review persistence (Sprint 3.1). Snapshots the deterministic day
 * review into `tomorrow_reviews` so Morning + Analytics can read it. Reproducible
 * from the engines — the row is a cache.
 */
export async function persistReview(db: Database, tz: string) {
  const ctx = await buildContext(db, tz);
  const review = buildDayReview(ctx.review, ctx.planningDate);
  const unfinished = ctx.carryForwardCandidates.filter((c) => c.kind === "task").length;
  const row = await repo.upsertReview(db, {
    planningDate: review.planningDate,
    completionScore: review.completionScore,
    plannerAccuracy: review.plannerAccuracy,
    deepWork: review.deepWorkMinutes,
    unfinishedTasks: unfinished,
    summary: review.headline,
  });
  return { review, persisted: { id: row.id, planningDate: row.planningDate } };
}

export async function recent(db: Database, _tz: string) {
  return (await repo.recentReviews(db)).map((r) => ({
    planningDate: r.planningDate,
    completionScore: r.completionScore,
    plannerAccuracy: r.plannerAccuracy,
    deepWork: r.deepWork,
    unfinishedTasks: r.unfinishedTasks,
    summary: r.summary,
  }));
}

/** Latest persisted review for Morning Briefing (yesterday's close). */
export async function latest(db: Database, tz: string) {
  const today = todayInTimeZone(tz);
  const rows = await repo.recentReviews(db, 2);
  return rows.find((r) => r.planningDate !== today) ?? rows[0] ?? null;
}
