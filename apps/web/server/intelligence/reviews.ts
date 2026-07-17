import "server-only";
import { randomUUID } from "node:crypto";
import {
  createIntelligenceEngine,
  generateReport,
  reviewsDueCount,
  type GeneratedReport,
  type ReportFormat,
  type ReviewPeriod,
  type ReviewSnapshot,
} from "@myos/core/intelligence";
import type { Database } from "@myos/db";
import { composeInput } from "./composer";
import * as repo from "./repository";

/**
 * Server review + report engine (Sprint 4.4). Builds an IMMUTABLE review snapshot from the
 * composed input and persists it insert-only; a report is a formatting of the latest snapshot
 * for a period. The engine's clock/ids are injected here — the only place that knows the real
 * `Date` — so the core stays pure.
 */

const engine = createIntelligenceEngine({ newId: () => randomUUID(), now: () => new Date() });

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Generate a review for a period and store the snapshot as history. */
export async function generateReview(
  db: Database,
  tz: string,
  period: ReviewPeriod,
  periodStart?: string,
): Promise<ReviewSnapshot> {
  const input = await composeInput(db, tz);
  const snapshot = engine.makeReviewSnapshot(input, period, periodStart ?? todayYmd());
  return repo.insertSnapshot(db, snapshot);
}

export async function listReviews(db: Database): Promise<ReviewSnapshot[]> {
  return repo.listSnapshots(db);
}

/**
 * Generate a report from the latest snapshot for the period; if none exists yet, build a
 * fresh snapshot first so a report is always available on demand.
 */
export async function generatePeriodReport(
  db: Database,
  tz: string,
  period: ReviewPeriod,
  format: ReportFormat = "markdown",
): Promise<GeneratedReport> {
  const existing = (await repo.listSnapshots(db)).find((s) => s.period === period);
  const snapshot = existing ?? (await generateReview(db, tz, period));
  const report = generateReport(snapshot, format, new Date());
  return repo.insertReport(db, report);
}

export async function listReports(db: Database): Promise<GeneratedReport[]> {
  return repo.listReports(db);
}

export async function reviewsDue(db: Database, tz: string): Promise<number> {
  return reviewsDueCount(await composeInput(db, tz));
}
