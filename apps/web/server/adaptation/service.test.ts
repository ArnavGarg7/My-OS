import { describe, expect, it, vi } from "vitest";
import type { Database } from "@myos/db";

/**
 * Adaptation service tests (Sprint 6.5). The repository is mocked so the full adaptation cycle runs
 * without a DB: profile/preferences/insights are derived deterministically from the gather seed + real
 * feedback, user overrides disable/edit learned preferences, sensitive policies never go automatic,
 * feedback is recorded, and the Chief seam returns personalization prefs (never execution authority).
 */

// In-memory store for the mocked repository.
const store: {
  feedback: { proposalId: string; subject: string; type: string; at: string }[];
  overrides: Record<string, { value?: string; enabled: boolean }>;
  policies: { category: string; mode: string }[];
  events: { kind: string; subject: string; detail: string; at: string }[];
} = { feedback: [], overrides: {}, policies: [], events: [] };

vi.mock("./repository", () => ({
  insertFeedback: vi.fn(async (_db, proposalId, subject, type) => {
    store.feedback.push({ proposalId, subject, type, at: new Date().toISOString() });
  }),
  listFeedback: vi.fn(async () => store.feedback),
  savePreferenceOverride: vi.fn(async (_db, key, _cat, patch) => {
    const prev = store.overrides[key] ?? { enabled: true };
    const value = patch.value !== undefined ? String(patch.value) : prev.value;
    store.overrides[key] = {
      ...(value !== undefined ? { value } : {}),
      enabled: patch.enabled !== undefined ? patch.enabled : prev.enabled,
    };
  }),
  loadPreferenceOverrides: vi.fn(async () => store.overrides),
  loadPolicies: vi.fn(async () => store.policies),
  savePolicy: vi.fn(async (_db, category, mode) => {
    const e = store.policies.find((p) => p.category === category);
    if (e) e.mode = mode;
    else store.policies.push({ category, mode });
  }),
  recordEvent: vi.fn(async (_db, kind, subject, detail) => {
    store.events.push({ kind, subject, detail, at: new Date().toISOString() });
  }),
  listEvents: vi.fn(async () => store.events),
  saveWeeklyReview: vi.fn(async () => {}),
  saveMonthlyReview: vi.fn(async () => {}),
}));

import * as service from "./service";
const db = {} as Database;

describe("profile + preferences — derived, confident, evidence-backed", () => {
  it("builds a non-empty versioned profile from the seed", async () => {
    const p = await service.profile(db);
    expect(p.fieldCount).toBeGreaterThan(0);
    expect(p.maturity).toBeGreaterThanOrEqual(0);
  });
  it("learns preferences with confidence + evidence + explanation", async () => {
    const { preferences } = await service.preferences(db);
    const focus = preferences.find((x) => x.key === "focus_block_length")!;
    expect(focus.value).toBe(90);
    expect(focus.confidence.level).not.toBe("unknown");
    expect(focus.explanation).toContain("Learned");
    expect(focus.caption).toMatch(/%$/);
  });
});

describe("user control — edit + disable overrides", () => {
  it("disables a learned preference so it drops from the profile", async () => {
    await service.editPreference(db, "study_location", { enabled: false });
    const { preferences } = await service.preferences(db);
    expect(preferences.find((p) => p.key === "study_location")!.enabled).toBe(false);
    const prof = await service.profile(db);
    const learning = prof.byCategory.learning ?? [];
    expect(learning.some((f) => f.key === "study_location")).toBe(false);
    expect(store.events.some((e) => e.kind === "preference_disabled")).toBe(true);
  });
  it("edits a preference value", async () => {
    await service.editPreference(db, "focus_block_length", { value: 120 });
    const { preferences } = await service.preferences(db);
    expect(preferences.find((p) => p.key === "focus_block_length")!.value).toBe(120);
  });
});

describe("feedback — recorded, personalization shaped, logic untouched", () => {
  it("records feedback and reflects it in the Chief personalization seam", async () => {
    await service.submitFeedback(db, "p1", "evening_meeting", "ignore_similar");
    await service.submitFeedback(db, "p2", "workout_reschedule", "excellent");
    const chief = await service.forChief(db);
    expect(chief.personalization.muted).toContain("evening_meeting");
    expect(chief.personalization.ordering.workout_reschedule).toBeGreaterThan(0);
    expect(["quiet", "standard", "assertive"]).toContain(chief.personalization.notificationStyle);
  });
});

describe("policies — sensitive categories never go automatic", () => {
  it("clamps a sensitive category away from automatic", async () => {
    const res = await service.setPolicy(db, "health", "automatic");
    expect(res.mode).toBe("suggested");
    const ok = await service.setPolicy(db, "productivity", "automatic");
    expect(ok.mode).toBe("automatic");
    const s = await service.settings(db);
    expect(s.policies.find((p) => p.category === "health")!.mode).not.toBe("automatic");
  });
});

describe("reviews + analytics + insights", () => {
  it("generates a weekly and monthly review", async () => {
    const wk = await service.weeklyReview(db);
    expect(wk.recommendationQuality).toBeGreaterThanOrEqual(0);
    const mo = await service.monthlyReview(db);
    expect(mo.systemAdaptation).toContain("preference");
  });
  it("surfaces insights and behavioral metrics", async () => {
    const ins = await service.insights(db);
    expect(ins.insights.length).toBeGreaterThan(0);
    const a = await service.analytics(db);
    expect(a.metrics.some((m) => m.key === "focus_hours")).toBe(true);
  });
});
