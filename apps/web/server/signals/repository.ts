import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  signalContextWindows,
  signalNotifications,
  signalRankings,
  signalSubscriptions,
  signalTimeline,
  signals as signalsTable,
} from "@myos/db/schema";
import type { RankedSignal, Signal, SignalTimelineEntry } from "@myos/core/events";

/**
 * Signals repository (Sprint 6.1). Persists the immutable signal layer: signals, their rankings,
 * notifications, context-window membership and the append-only timeline. Signals are never edited in
 * place — only their lifecycle `status` transitions (active → superseded/expired/acknowledged).
 */

/** Load the currently-active signals (the "previous" state the engine reconciles against). */
export async function loadActiveSignals(db: Database): Promise<Signal[]> {
  const rows = await db.select().from(signalsTable).where(eq(signalsTable.status, "active"));
  return rows.map(rowToSignal);
}

function rowToSignal(r: typeof signalsTable.$inferSelect): Signal {
  return {
    id: r.id,
    source: r.source as Signal["source"],
    category: r.category as Signal["category"],
    severity: r.severity as Signal["severity"],
    confidence: r.confidence,
    createdAt: r.createdAt.toISOString(),
    expiresAt: r.expiresAt ? r.expiresAt.toISOString() : null,
    window: r.window as Signal["window"],
    explanation: r.explanation,
    relatedObjects: r.relatedObjects,
    eventIds: r.eventIds,
    status: r.status as Signal["status"],
    dedupeKey: r.dedupeKey,
  };
}

/**
 * Persist a completed engine cycle: insert the new signals (+ rankings, notifications, windows,
 * timeline) and flip superseded/expired prior signals. Immutable — new rows, status-only updates.
 */
export async function recordCycle(
  db: Database,
  input: {
    signals: RankedSignal[];
    transitions: { signalId: string; to: "expired" | "superseded" }[];
    timeline: SignalTimelineEntry[];
  },
): Promise<void> {
  // Flip prior signals' status (the only mutation permitted on an immutable signal).
  const byStatus = new Map<string, string[]>();
  for (const t of input.transitions) {
    const arr = byStatus.get(t.to) ?? [];
    arr.push(t.signalId);
    byStatus.set(t.to, arr);
  }
  for (const [status, ids] of byStatus) {
    if (ids.length)
      await db.update(signalsTable).set({ status }).where(inArray(signalsTable.id, ids));
  }

  // Insert new active signals that don't already exist (dedupeKey + active).
  const existing = new Set(
    (
      await db
        .select({ k: signalsTable.dedupeKey })
        .from(signalsTable)
        .where(eq(signalsTable.status, "active"))
    ).map((r) => r.k),
  );
  for (const s of input.signals) {
    if (existing.has(s.dedupeKey)) continue;
    const [row] = await db
      .insert(signalsTable)
      .values({
        source: s.source,
        category: s.category,
        severity: s.severity,
        confidence: s.confidence,
        window: s.window,
        status: s.status,
        dedupeKey: s.dedupeKey,
        explanation: s.explanation,
        relatedObjects: s.relatedObjects,
        eventIds: s.eventIds,
        expiresAt: s.expiresAt ? new Date(s.expiresAt) : null,
      })
      .returning({ id: signalsTable.id });
    const id = row!.id;
    await db.insert(signalRankings).values({ signalId: id, ...s.ranking });
    await db
      .insert(signalNotifications)
      .values({ signalId: id, level: s.notify, surfaced: s.notify !== "silent" });
    await db.insert(signalContextWindows).values({ signalId: id, window: s.window });
    existing.add(s.dedupeKey);
  }

  if (input.timeline.length) {
    await db.insert(signalTimeline).values(
      input.timeline.map((e) => ({
        signalId: e.signalId,
        kind: e.kind,
        detail: e.detail,
        at: new Date(e.at),
      })),
    );
  }
}

/** The audit/replay timeline, optionally for one signal. */
export async function listTimeline(db: Database, signalId?: string, limit = 100) {
  const base = db.select().from(signalTimeline);
  const q = signalId ? base.where(eq(signalTimeline.signalId, signalId)) : base;
  return q.orderBy(desc(signalTimeline.at)).limit(limit);
}

/** Recent signals (history), newest first. */
export async function listHistory(db: Database, limit = 50): Promise<Signal[]> {
  const rows = await db
    .select()
    .from(signalsTable)
    .orderBy(desc(signalsTable.createdAt))
    .limit(limit);
  return rows.map(rowToSignal);
}

/** Load/save the single subscription row. */
export async function loadSubscription(
  db: Database,
): Promise<{ categories: string[]; minLevel: string } | null> {
  const [row] = await db.select().from(signalSubscriptions).limit(1);
  return row ? { categories: row.categories, minLevel: row.minLevel } : null;
}

export async function saveSubscription(
  db: Database,
  categories: string[],
  minLevel: string,
): Promise<void> {
  const [existing] = await db
    .select({ id: signalSubscriptions.id })
    .from(signalSubscriptions)
    .limit(1);
  if (existing) {
    await db
      .update(signalSubscriptions)
      .set({ categories, minLevel, updatedAt: new Date() })
      .where(eq(signalSubscriptions.id, existing.id));
  } else {
    await db.insert(signalSubscriptions).values({ categories, minLevel });
  }
}

/** Mark a signal acknowledged (lifecycle status only). */
export async function acknowledgeSignal(db: Database, signalId: string): Promise<void> {
  await db
    .update(signalsTable)
    .set({ status: "acknowledged" })
    .where(and(eq(signalsTable.id, signalId), eq(signalsTable.status, "active")));
}
