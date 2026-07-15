import "server-only";
import { and, desc, eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  analyticsReports,
  analyticsSnapshots,
  monthlyReviews,
  weeklyReviews,
  type AnalyticsReportRow,
  type AnalyticsSnapshotRow,
  type MonthlyReviewRow,
  type WeeklyReviewRow,
} from "@myos/db/schema";

/**
 * Analytics persistence (Sprint 2.14). Analytics never owns business data — these
 * tables only cache generated reports / daily snapshots + store period reviews.
 * Every row is reproducible from the source engines, so upserts are safe.
 */
export async function insertReport(
  db: Database,
  values: {
    reportType: AnalyticsReportRow["reportType"];
    periodStart: string;
    periodEnd: string;
    metadata: Record<string, unknown>;
  },
): Promise<AnalyticsReportRow> {
  const [row] = await db.insert(analyticsReports).values(values).returning();
  if (!row) throw new Error("Failed to insert report");
  return row;
}

export function listReports(
  db: Database,
  reportType?: AnalyticsReportRow["reportType"],
): Promise<AnalyticsReportRow[]> {
  const where = reportType ? eq(analyticsReports.reportType, reportType) : undefined;
  return db
    .select()
    .from(analyticsReports)
    .where(where)
    .orderBy(desc(analyticsReports.generatedAt))
    .limit(50);
}

/** Upsert a daily snapshot (one row per snapshot_date). */
export async function upsertSnapshot(
  db: Database,
  values: Omit<AnalyticsSnapshotRow, "id" | "createdAt">,
): Promise<AnalyticsSnapshotRow> {
  const [row] = await db
    .insert(analyticsSnapshots)
    .values(values)
    .onConflictDoUpdate({ target: analyticsSnapshots.snapshotDate, set: values })
    .returning();
  if (!row) throw new Error("Failed to upsert snapshot");
  return row;
}

export function listSnapshots(db: Database, limit = 90): Promise<AnalyticsSnapshotRow[]> {
  return db
    .select()
    .from(analyticsSnapshots)
    .orderBy(desc(analyticsSnapshots.snapshotDate))
    .limit(limit);
}

export async function insertWeeklyReview(
  db: Database,
  values: {
    weekStart: string;
    weekEnd: string;
    summary: string;
    metadata: Record<string, unknown>;
  },
): Promise<WeeklyReviewRow> {
  const [row] = await db.insert(weeklyReviews).values(values).returning();
  if (!row) throw new Error("Failed to insert weekly review");
  return row;
}

export function listWeeklyReviews(db: Database): Promise<WeeklyReviewRow[]> {
  return db.select().from(weeklyReviews).orderBy(desc(weeklyReviews.weekStart)).limit(52);
}

export async function insertMonthlyReview(
  db: Database,
  values: { month: number; year: number; summary: string; metadata: Record<string, unknown> },
): Promise<MonthlyReviewRow> {
  const [row] = await db.insert(monthlyReviews).values(values).returning();
  if (!row) throw new Error("Failed to insert monthly review");
  return row;
}

export function getMonthlyReview(
  db: Database,
  month: number,
  year: number,
): Promise<MonthlyReviewRow | undefined> {
  return db
    .select()
    .from(monthlyReviews)
    .where(and(eq(monthlyReviews.month, month), eq(monthlyReviews.year, year)))
    .limit(1)
    .then((rows) => rows[0]);
}
