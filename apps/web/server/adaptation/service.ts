import "server-only";
import { randomUUID } from "node:crypto";
import type { Database } from "@myos/db";
import {
  runAdaptation,
  weeklyReview as buildWeekly,
  monthlyReview as buildMonthly,
  defaultPolicies,
  effectiveMode,
  explainPreference,
  confidenceCaption,
  profileByCategory,
  actionablePreferences,
  habitsAtRisk,
  topInsights,
  decisionTendencies,
  type AdaptationResult,
  type Preference,
} from "@myos/core/adaptation";
import { gatherAdaptationInput } from "./gather";
import * as repo from "./repository";

/**
 * Adaptation service (Sprint 6.5). Orchestrates one deterministic adaptation cycle: gather (real
 * feedback + observations) → `runAdaptation` → apply the user's preference OVERRIDES → return the
 * derived Personal Profile / preferences / habits / insights / reviews / personalization. The Chief
 * consumes `forChief` as a READ MODEL only. Nothing here mutates other modules' data, executes, or
 * bypasses approval; personalization shapes presentation, never business logic. No AI participates.
 */

const newId = () => randomUUID();

/** Run a cycle and apply user overrides (edited value / disabled). Deterministic per input. */
async function cycle(db: Database, now = new Date()): Promise<AdaptationResult> {
  const input = await gatherAdaptationInput(db, now);
  const result = runAdaptation(input, { newId });
  const overrides: Record<string, { value?: string; enabled: boolean }> = await repo
    .loadPreferenceOverrides(db)
    .catch(() => ({}));
  if (Object.keys(overrides).length > 0) {
    result.preferences = result.preferences.map((p): Preference => {
      const o = overrides[p.key];
      if (!o) return p;
      return {
        ...p,
        value: o.value !== undefined && o.value !== "" ? coerce(o.value) : p.value,
        enabled: o.enabled,
        source: "explicit",
      };
    });
    // Rebuild the profile view so disabled preferences drop out.
    result.profile = {
      ...result.profile,
      fields: result.profile.fields.filter((f) => overrides[f.key]?.enabled !== false),
    };
  }
  return result;
}

function coerce(v: string | number): string | number {
  const n = Number(v);
  return typeof v === "string" && v !== "" && !Number.isNaN(n) ? n : v;
}

/** adaptation.profile — the versioned Personal Profile grouped by category. */
export async function profile(db: Database) {
  const r = await cycle(db);
  return {
    byCategory: profileByCategory(r),
    maturity: r.profile.maturity,
    fieldCount: r.profile.fields.length,
  };
}

/** adaptation.preferences — learned preferences with evidence + explanation. */
export async function preferences(db: Database) {
  const r = await cycle(db);
  return {
    preferences: r.preferences.map((p) => ({
      key: p.key,
      category: p.category,
      value: p.value,
      enabled: p.enabled,
      source: p.source,
      confidence: p.confidence,
      caption: confidenceCaption(p.confidence),
      evidence: p.evidence,
      explanation: explainPreference(p).summary,
    })),
    actionable: actionablePreferences(r).length,
  };
}

/** adaptation.habits — habit models + which are at risk. */
export async function habits(db: Database) {
  const r = await cycle(db);
  return { habits: r.habits, atRisk: habitsAtRisk(r) };
}

/** adaptation.routines — discovered routines. */
export async function routines(db: Database) {
  const r = await cycle(db);
  return { routines: r.routines };
}

/** adaptation.insights — explainable, evidence-backed insights. */
export async function insights(db: Database) {
  const r = await cycle(db);
  return {
    insights: topInsights(r, 12).map((i) => ({ ...i, caption: confidenceCaption(i.confidence) })),
  };
}

/** adaptation.analytics — behavioral metrics + decision tendencies. */
export async function analytics(db: Database) {
  const r = await cycle(db);
  const feedback = await repo.listFeedback(db).catch(() => []);
  return {
    metrics: r.metrics,
    decisions: decisionTendencies(
      feedback.map((f) => ({
        proposalId: f.proposalId,
        subject: f.subject,
        type: f.type as never,
        at: f.at,
      })),
    ),
  };
}

/** adaptation.feedback (query) — recent feedback + aggregate weights. */
export async function feedbackOverview(db: Database) {
  const r = await cycle(db);
  const recent = await repo.listFeedback(db, 50).catch(() => []);
  return { weights: r.weights, recent };
}

/** adaptation.submitFeedback — record feedback (updates deterministic weights; no logic changes). */
export async function submitFeedback(
  db: Database,
  proposalId: string,
  subject: string,
  type: string,
) {
  await repo.insertFeedback(db, proposalId, subject, type).catch(() => {});
  await repo.recordEvent(db, "feedback_received", subject, `feedback: ${type}`).catch(() => {});
  return { ok: true as const };
}

/** adaptation.editPreference — edit a value or enable/disable a learned preference. */
export async function editPreference(
  db: Database,
  key: string,
  patch: { value?: string | number; enabled?: boolean },
) {
  // Discover the category from the current cycle (so a fresh override row is well-formed).
  const r = await cycle(db);
  const category = r.preferences.find((p) => p.key === key)?.category ?? "productivity";
  await repo.savePreferenceOverride(db, key, category, patch).catch(() => {});
  const kind = patch.enabled === false ? "preference_disabled" : "preference_updated";
  await repo.recordEvent(db, kind, key, JSON.stringify(patch)).catch(() => {});
  return { ok: true as const };
}

/** adaptation.weeklyReview — generate + persist a reproducible weekly review. */
export async function weeklyReview(db: Database, periodStart?: string, periodEnd?: string) {
  const now = new Date();
  const end = periodEnd ?? now.toISOString().slice(0, 10);
  const start = periodStart ?? new Date(now.getTime() - 7 * 86_400_000).toISOString().slice(0, 10);
  const r = await cycle(db, now);
  const review = buildWeekly({
    periodStart: start,
    periodEnd: end,
    habits: r.habits,
    routines: r.routines,
    metrics: r.metrics,
    feedback: (await repo.listFeedback(db).catch(() => [])).map((f) => ({
      proposalId: f.proposalId,
      subject: f.subject,
      type: f.type as never,
      at: f.at,
    })),
    insights: r.insights,
  });
  await repo
    .saveWeeklyReview(db, start, end, review as unknown as Record<string, unknown>)
    .catch(() => {});
  return review;
}

/** adaptation.monthlyReview — generate + persist a reproducible monthly review. */
export async function monthlyReview(db: Database, periodStart?: string, periodEnd?: string) {
  const now = new Date();
  const end = periodEnd ?? now.toISOString().slice(0, 10);
  const start = periodStart ?? new Date(now.getTime() - 30 * 86_400_000).toISOString().slice(0, 10);
  const r = await cycle(db, now);
  const review = buildMonthly({
    periodStart: start,
    periodEnd: end,
    habits: r.habits,
    preferences: r.preferences,
    metrics: r.metrics,
    profileMaturity: r.profile.maturity,
  });
  await repo
    .saveMonthlyReview(db, start, end, review as unknown as Record<string, unknown>)
    .catch(() => {});
  return review;
}

/** adaptation.timeline — the adaptation audit trail. */
export async function timeline(db: Database) {
  return { events: await repo.listEvents(db).catch(() => []) };
}

/** adaptation.settings — learning policies (+ profile maturity). */
export async function settings(db: Database) {
  const saved = await repo.loadPolicies(db).catch(() => []);
  const merged = defaultPolicies().map((d) => {
    const s = saved.find((x) => x.category === d.category);
    return s ? { category: d.category, mode: effectiveMode(d.category, s.mode) } : d;
  });
  return { policies: merged };
}

/** adaptation.setPolicy — set a category's learning mode (sensitive clamped away from automatic). */
export async function setPolicy(db: Database, category: string, mode: string) {
  const clamped = effectiveMode(category as never, mode as never);
  await repo.savePolicy(db, category, clamped).catch(() => {});
  return { ok: true as const, category, mode: clamped };
}

/**
 * Chief seam (Sprint 6.5). The Chief consumes the Personal Profile's personalization prefs as an
 * additional READ MODEL — ordering/timing/notification-style/muted subjects — to shape HOW it presents
 * recommendations. It never changes WHAT the Chief recommends (business logic stays deterministic), and
 * the profile is never an execution authority. Fully guarded → safe defaults on any failure.
 */
export async function forChief(db: Database) {
  try {
    const r = await cycle(db);
    return { personalization: r.personalization, maturity: r.profile.maturity };
  } catch {
    return {
      personalization: {
        ordering: {},
        preferredHours: [],
        notificationStyle: "standard" as const,
        muted: [],
      },
      maturity: 0,
    };
  }
}
