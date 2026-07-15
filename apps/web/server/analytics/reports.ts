import "server-only";
import { analyticsEngine, type ReportType } from "@myos/core/analytics";
import type { Database } from "@myos/db";
import { buildContext } from "./service";
import * as repo from "./repository";
import { reportRowToDTO, reviewSummaryLine, snapshotColumns } from "./mapper";

/**
 * Analytics report service (Sprint 2.14). Generates a report on demand, caches it
 * to `analytics_reports`, and persists today's daily scoreboard snapshot. Reports
 * are reproducible — the cache is an optimisation, never the source of truth.
 */
export async function generate(db: Database, tz: string, type: ReportType) {
  const ctx = await buildContext(db, tz);
  const review = analyticsEngine.review(ctx, type);

  const row = await repo.insertReport(db, {
    reportType: type,
    periodStart: review.periodStart,
    periodEnd: review.periodEnd,
    metadata: { scores: review.scores, summary: reviewSummaryLine(review), review },
  });

  // Cache today's scoreboard snapshot.
  await repo.upsertSnapshot(db, snapshotColumns(review.periodEnd, review.scores));

  return { report: reportRowToDTO(row), review };
}

export async function list(db: Database, type?: ReportType) {
  return (await repo.listReports(db, type)).map(reportRowToDTO);
}

export async function snapshots(db: Database) {
  return repo.listSnapshots(db);
}
