import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Database } from "@myos/db";
import {
  adaptationEvents,
  adaptationMonthlyReviews,
  adaptationPolicies,
  adaptationWeeklyReviews,
  personalPreferences,
  recommendationFeedback,
} from "@myos/db/schema";
import type { AdaptationPolicy, LearningMode, ProfileCategory } from "@myos/core/adaptation";

/**
 * Adaptation repository (Sprint 6.5). Persists the durable, user-owned adaptation state: recommendation
 * feedback (drives personalization), per-preference user OVERRIDES (edited value / disabled), learning
 * policies, the immutable adaptation event log, and generated reviews. The derived profile / habits /
 * insights are recomputed on read (reproducible from history) — not stored per cycle.
 */

// ── Feedback ────────────────────────────────────────────────────────────────
export async function insertFeedback(
  db: Database,
  proposalId: string,
  subject: string,
  type: string,
): Promise<void> {
  await db.insert(recommendationFeedback).values({ proposalId, subject, type });
}

export async function listFeedback(db: Database, limit = 500) {
  const rows = await db
    .select()
    .from(recommendationFeedback)
    .orderBy(desc(recommendationFeedback.at))
    .limit(limit);
  return rows.map((r) => ({
    proposalId: r.proposalId,
    subject: r.subject,
    type: r.type,
    at: r.at.toISOString(),
  }));
}

// ── Preference overrides (edit / disable) ─────────────────────────────────────
export interface PrefOverride {
  value?: string;
  enabled: boolean;
}

/** Upsert a user override for a learned preference. */
export async function savePreferenceOverride(
  db: Database,
  prefKey: string,
  category: string,
  patch: { value?: string | number; enabled?: boolean },
): Promise<void> {
  const [existing] = await db
    .select({
      id: personalPreferences.id,
      value: personalPreferences.value,
      enabled: personalPreferences.enabled,
    })
    .from(personalPreferences)
    .where(eq(personalPreferences.prefKey, prefKey))
    .limit(1);
  const value = patch.value !== undefined ? String(patch.value) : (existing?.value ?? "");
  const enabled = patch.enabled !== undefined ? patch.enabled : (existing?.enabled ?? true);
  if (existing) {
    await db
      .update(personalPreferences)
      .set({ value, enabled, source: "explicit", updatedAt: new Date() })
      .where(eq(personalPreferences.id, existing.id));
  } else {
    await db
      .insert(personalPreferences)
      .values({ prefKey, category, value, enabled, source: "explicit" });
  }
}

/** All user overrides, keyed by preference key. */
export async function loadPreferenceOverrides(db: Database): Promise<Record<string, PrefOverride>> {
  const rows = await db.select().from(personalPreferences);
  return Object.fromEntries(
    rows.map((r) => [r.prefKey, { value: r.value, enabled: r.enabled } as PrefOverride]),
  );
}

// ── Policies ─────────────────────────────────────────────────────────────────
export async function loadPolicies(db: Database): Promise<AdaptationPolicy[]> {
  const rows = await db.select().from(adaptationPolicies);
  return rows.map((r) => ({
    category: r.category as ProfileCategory,
    mode: r.mode as LearningMode,
  }));
}

export async function savePolicy(db: Database, category: string, mode: string): Promise<void> {
  const [existing] = await db
    .select({ id: adaptationPolicies.id })
    .from(adaptationPolicies)
    .where(eq(adaptationPolicies.category, category))
    .limit(1);
  if (existing) {
    await db
      .update(adaptationPolicies)
      .set({ mode, updatedAt: new Date() })
      .where(eq(adaptationPolicies.id, existing.id));
  } else {
    await db.insert(adaptationPolicies).values({ category, mode });
  }
}

// ── Adaptation event log (audit) ─────────────────────────────────────────────
export async function recordEvent(
  db: Database,
  kind: string,
  subject: string,
  detail: string,
): Promise<void> {
  await db.insert(adaptationEvents).values({ kind, subject, detail });
}

export async function listEvents(db: Database, limit = 100) {
  const rows = await db
    .select()
    .from(adaptationEvents)
    .orderBy(desc(adaptationEvents.at))
    .limit(limit);
  return rows.map((r) => ({
    kind: r.kind,
    subject: r.subject,
    detail: r.detail,
    at: r.at.toISOString(),
  }));
}

// ── Reviews ──────────────────────────────────────────────────────────────────
export async function saveWeeklyReview(
  db: Database,
  periodStart: string,
  periodEnd: string,
  content: Record<string, unknown>,
): Promise<void> {
  await db.insert(adaptationWeeklyReviews).values({ periodStart, periodEnd, content });
}

export async function saveMonthlyReview(
  db: Database,
  periodStart: string,
  periodEnd: string,
  content: Record<string, unknown>,
): Promise<void> {
  await db.insert(adaptationMonthlyReviews).values({ periodStart, periodEnd, content });
}
