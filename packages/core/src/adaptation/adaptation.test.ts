import { describe, expect, it } from "vitest";
import {
  runAdaptation,
  learnPreferences,
  modelHabit,
  discoverRoutines,
  computeConfidence,
  bandFor,
  computeFeedbackWeights,
  recommendationQuality,
  generateInsights,
  personalization,
  weeklyReview,
  monthlyReview,
  defaultPolicies,
  effectiveMode,
  canAutoApply,
  explainPreference,
  actionablePreferences,
  habitsAtRisk,
  decisionTendencies,
  type AdaptationInput,
  type HabitObservation,
  type Observation,
  type FeedbackRecord,
} from "./index";

/**
 * Adaptive Personal Intelligence (Sprint 6.5). Deterministic: same history → same profile. Every
 * learned value is confidence-scored + evidence-backed; nothing mutates data or bypasses approval;
 * sensitive categories never auto-learn. All time injected. No AI, no randomness.
 */

let n = 0;
const newId = () => `ad${(n += 1)}`;
const deps = { newId };
const now = new Date("2026-07-20T10:00:00.000Z");

/** Build a run of implicit observations for a key spread over `days` days. */
function series(
  key: string,
  category: Observation["category"],
  value: string | number,
  count: number,
  startDay = 0,
): Observation[] {
  return Array.from({ length: count }, (_, i) => ({
    category,
    key,
    value,
    at: new Date(now.getTime() - (startDay + i) * 86_400_000).toISOString(),
  }));
}

describe("confidence — deterministic bands, unknown below the floor", () => {
  it("returns unknown with <3 observations and bands higher evidence up", () => {
    expect(
      computeConfidence({
        observations: 2,
        consistency: 1,
        timeSpanDays: 10,
        contradictions: 0,
        recencyDays: 1,
      }).level,
    ).toBe("unknown");
    const strong = computeConfidence({
      observations: 20,
      consistency: 1,
      timeSpanDays: 42,
      contradictions: 0,
      recencyDays: 1,
    });
    expect(strong.level).toBe("very_high");
    expect(bandFor(0.65)).toBe("high");
    // contradictions lower the score.
    const weakened = computeConfidence({
      observations: 10,
      consistency: 0.6,
      timeSpanDays: 20,
      contradictions: 6,
      recencyDays: 2,
    });
    expect(weakened.score).toBeLessThan(strong.score);
  });
});

describe("preference learning — mode + consistency + evidence", () => {
  it("learns the dominant value with linked evidence", () => {
    const obs = [
      ...series("focus_block_length", "focus", 90, 8),
      ...series("focus_block_length", "focus", 60, 2, 8),
    ];
    const prefs = learnPreferences(obs, now);
    const fb = prefs.find((p) => p.key === "focus_block_length")!;
    expect(fb.value).toBe(90);
    expect(fb.evidence.observations).toBe(10);
    expect(fb.confidence.level).not.toBe("unknown");
    expect(fb.enabled).toBe(true);
  });
  it("weighs explicit observations above implicit ones", () => {
    const obs: Observation[] = [
      {
        category: "notifications",
        key: "notification_style",
        value: "quiet",
        at: now.toISOString(),
        weight: 5,
      },
      ...series("notification_style", "notifications", "assertive", 3),
    ];
    const prefs = learnPreferences(obs, now);
    expect(prefs[0]!.source).toBe("explicit");
  });
});

describe("habit intelligence — read-only models", () => {
  it("models strength, trend and recovery from a completion series", () => {
    const s: HabitObservation[] = Array.from({ length: 14 }, (_, i) => ({
      date: new Date(now.getTime() - (13 - i) * 86_400_000).toISOString().slice(0, 10),
      completed: i >= 4, // weak early, strong lately → rising
    }));
    const h = modelHabit("morning_workout", s, now)!;
    expect(h.trend).toBe("rising");
    expect(h.strength).toBeGreaterThan(0.4);
    expect(h.confidence.level).not.toBe("unknown");
  });
});

describe("routine discovery — requires repeated evidence", () => {
  it("discovers a weekly routine that recurs enough, ignores one-offs", () => {
    // 4 Mondays ~09:00 UTC.
    const mondays: Observation[] = [0, 7, 14, 21].map((d) => ({
      category: "planning",
      key: "weekly_planning",
      value: "done",
      at: new Date(Date.UTC(2026, 5, 1 + d, 9, 0)).toISOString(), // 2026-06-01 is a Monday
    }));
    const oneOff: Observation[] = [
      { category: "planning", key: "random", value: "x", at: now.toISOString() },
    ];
    const routines = discoverRoutines([...mondays, ...oneOff], now);
    expect(routines.length).toBe(1);
    expect(routines[0]!.occurrences).toBe(4);
    expect(routines[0]!.dayOfWeek).toBe(1); // Monday
  });
});

describe("feedback engine — deterministic weights, never mutates logic", () => {
  it("folds feedback into per-subject weights + mute list", () => {
    const fb: FeedbackRecord[] = [
      {
        proposalId: "p1",
        subject: "workout_reschedule",
        type: "excellent",
        at: "2026-07-01T00:00:00Z",
      },
      {
        proposalId: "p2",
        subject: "workout_reschedule",
        type: "helpful",
        at: "2026-07-02T00:00:00Z",
      },
      {
        proposalId: "p3",
        subject: "evening_meeting",
        type: "ignore_similar",
        at: "2026-07-03T00:00:00Z",
      },
    ];
    const w = computeFeedbackWeights(fb);
    expect(w.bySubject.workout_reschedule).toBeGreaterThan(0);
    expect(w.muted).toContain("evening_meeting");
    expect(recommendationQuality(fb)).toBeCloseTo(0.67, 1);
    const tend = decisionTendencies(fb);
    expect(tend.find((t) => t.subject === "workout_reschedule")!.tendency).toBe(1);
  });
});

describe("policies — sensitive categories never auto-learn", () => {
  it("clamps automatic mode for sensitive categories", () => {
    expect(effectiveMode("health", "automatic")).toBe("suggested");
    expect(effectiveMode("productivity", "automatic")).toBe("automatic");
    const pols = defaultPolicies();
    expect(canAutoApply("productivity", pols)).toBe(true);
    expect(canAutoApply("decision_style", pols)).toBe(false);
  });
});

describe("full cycle — determinism + explainability", () => {
  const input: AdaptationInput = {
    observations: [
      ...series("focus_block_length", "focus", 90, 10),
      ...series("study_location", "learning", "library", 8),
      ...series("focus_hours", "productivity", 5, 6),
      ...series("focus_hours", "productivity", 7, 6, 6),
    ],
    habitSeries: [
      {
        key: "morning_workout",
        series: Array.from({ length: 14 }, (_, i) => ({
          date: new Date(now.getTime() - (13 - i) * 86_400_000).toISOString().slice(0, 10),
          completed: i % 4 !== 0,
        })),
      },
    ],
    feedback: [
      { proposalId: "p1", subject: "focus_block", type: "helpful", at: "2026-07-10T00:00:00Z" },
    ],
    now,
  };

  it("produces a versioned profile, insights and personalization identically on re-run", () => {
    n = 0;
    const a = runAdaptation(input, deps);
    n = 0;
    const b = runAdaptation(input, deps);
    expect(a.profile).toEqual(b.profile);
    expect(a.profile.fields.length).toBeGreaterThan(0);
    expect(a.profile.fields.every((f) => f.version === 1 && f.confidence && f.evidence)).toBe(true);
    expect(a.profile.maturity).toBeGreaterThanOrEqual(0);
    expect(a.insights.length).toBeGreaterThan(0);
    expect(
      actionablePreferences(a).every(
        (p) => p.confidence.level === "high" || p.confidence.level === "very_high",
      ),
    ).toBe(true);
  });

  it("explains a preference with evidence + confidence", () => {
    n = 0;
    const a = runAdaptation(input, deps);
    const ex = explainPreference(a.preferences[0]!);
    expect(ex.editable).toBe(true);
    expect(ex.summary).toContain("Learned");
    expect(ex.evidence.observations).toBeGreaterThan(0);
  });

  it("generates weekly + monthly reviews reproducibly", () => {
    n = 0;
    const a = runAdaptation(input, deps);
    const wk = weeklyReview({
      periodStart: "2026-07-13",
      periodEnd: "2026-07-20",
      habits: a.habits,
      routines: a.routines,
      metrics: a.metrics,
      feedback: input.feedback,
      insights: a.insights,
    });
    expect(wk.recommendationQuality).toBeGreaterThanOrEqual(0);
    const mo = monthlyReview({
      periodStart: "2026-06-20",
      periodEnd: "2026-07-20",
      habits: a.habits,
      preferences: a.preferences,
      metrics: a.metrics,
      profileMaturity: a.profile.maturity,
    });
    expect(mo.metrics.length).toBe(a.metrics.length);
    expect(mo.systemAdaptation).toContain("preference");
  });

  it("personalization shapes presentation only (muted + ordering + hours)", () => {
    const p = personalization({
      weights: computeFeedbackWeights([
        {
          proposalId: "p",
          subject: "evening_meeting",
          type: "ignore_similar",
          at: "2026-07-01T00:00:00Z",
        },
      ]),
      preferences: [],
      routines: [],
    });
    expect(p.muted).toContain("evening_meeting");
    expect(["quiet", "standard", "assertive"]).toContain(p.notificationStyle);
  });

  it("surfaces at-risk habits and generated insights", () => {
    const declining: HabitObservation[] = Array.from({ length: 12 }, (_, i) => ({
      date: new Date(now.getTime() - (11 - i) * 86_400_000).toISOString().slice(0, 10),
      completed: i < 6, // strong early, gone lately → declining + break risk
    }));
    const h = modelHabit("evening_reading", declining, now)!;
    const ins = generateInsights({ preferences: [], habits: [h], routines: [], metrics: [] }, deps);
    const at = habitsAtRisk({
      profile: { fields: [], maturity: 0, generatedAt: now.toISOString() },
      preferences: [],
      habits: [h],
      routines: [],
      metrics: [],
      insights: ins,
      weights: { bySubject: {}, muted: [], totalFeedback: 0 },
      personalization: {
        ordering: {},
        preferredHours: [],
        notificationStyle: "standard",
        muted: [],
      },
    });
    expect(at.length).toBe(1);
  });
});
