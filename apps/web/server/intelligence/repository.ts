import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  dashboardPreferences,
  executiveReports,
  reviewSnapshots,
  savedCollections,
} from "@myos/db/schema";
import type {
  Collection,
  DashboardPreferences,
  GeneratedReport,
  ReviewSnapshot,
} from "@myos/core/intelligence";
import * as m from "./mapper";

/**
 * Intelligence persistence (Sprint 4.4). CRUD over the config + snapshot tables ONLY. No
 * analytics are written here; every dashboard view is recomputed on read. Snapshots are
 * insert-only — a review row, once written, is never updated.
 */

/* ── Dashboard preferences (single row) ─────────────────────────────────── */

export async function getPreferences(db: Database): Promise<DashboardPreferences | null> {
  const [row] = await db.select().from(dashboardPreferences).limit(1);
  return row ? m.preferencesRowTo(row) : null;
}

export async function savePreferences(
  db: Database,
  prefs: DashboardPreferences,
): Promise<DashboardPreferences> {
  const [existing] = await db.select().from(dashboardPreferences).limit(1);
  if (existing) {
    const [row] = await db
      .update(dashboardPreferences)
      .set({
        widgetOrder: prefs.widgetOrder,
        hiddenWidgets: prefs.hiddenWidgets,
        updatedAt: new Date(),
      })
      .where(eq(dashboardPreferences.id, existing.id))
      .returning();
    return m.preferencesRowTo(row!);
  }
  const [row] = await db
    .insert(dashboardPreferences)
    .values({ widgetOrder: prefs.widgetOrder, hiddenWidgets: prefs.hiddenWidgets })
    .returning();
  return m.preferencesRowTo(row!);
}

/* ── Collections ────────────────────────────────────────────────────────── */

export async function listCollections(db: Database): Promise<Collection[]> {
  const rows = await db.select().from(savedCollections).orderBy(savedCollections.name);
  return rows.map(m.collectionRowTo);
}

export async function insertCollection(db: Database, collection: Collection): Promise<Collection> {
  const [row] = await db
    .insert(savedCollections)
    .values({ name: collection.name, entityRefs: collection.entityRefs })
    .returning();
  return m.collectionRowTo(row!);
}

export async function updateCollectionRow(
  db: Database,
  id: string,
  patch: Partial<Collection>,
): Promise<Collection | null> {
  const [row] = await db
    .update(savedCollections)
    .set({
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.entityRefs !== undefined ? { entityRefs: patch.entityRefs } : {}),
      updatedAt: new Date(),
    })
    .where(eq(savedCollections.id, id))
    .returning();
  return row ? m.collectionRowTo(row) : null;
}

export async function deleteCollection(db: Database, id: string): Promise<void> {
  await db.delete(savedCollections).where(eq(savedCollections.id, id));
}

/* ── Review snapshots (insert-only, immutable) ──────────────────────────── */

export async function listSnapshots(db: Database): Promise<ReviewSnapshot[]> {
  const rows = await db.select().from(reviewSnapshots).orderBy(desc(reviewSnapshots.createdAt));
  return rows.map(m.snapshotRowTo);
}

export async function insertSnapshot(
  db: Database,
  snapshot: ReviewSnapshot,
): Promise<ReviewSnapshot> {
  const { period, periodStart, ...payload } = snapshot;
  const [row] = await db
    .insert(reviewSnapshots)
    .values({ period, periodStart, payload })
    .returning();
  return m.snapshotRowTo(row!);
}

/* ── Executive reports ──────────────────────────────────────────────────── */

export async function listReports(db: Database): Promise<GeneratedReport[]> {
  const rows = await db.select().from(executiveReports).orderBy(desc(executiveReports.generatedAt));
  return rows.map(m.reportRowTo);
}

export async function insertReport(
  db: Database,
  report: GeneratedReport,
): Promise<GeneratedReport> {
  const [row] = await db
    .insert(executiveReports)
    .values({
      period: report.period,
      format: report.format,
      title: report.title,
      content: report.content,
    })
    .returning();
  return m.reportRowTo(row!);
}
