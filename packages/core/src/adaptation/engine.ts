/**
 * Adaptation Engine (Sprint 6.5, spec §Adaptation Pipeline). The deterministic orchestrator: from
 * historical observations + habit series + feedback it produces the Personal Profile, learned
 * preferences, habit/routine models, behavioral metrics, insights and the Chief's personalization
 * prefs — every field versioned, confidence-scored and evidence-backed. Pure — no IO, no AI, no
 * randomness (ids + now injected). Re-running over the same input yields byte-identical output.
 *
 * Adaptation is "another deterministic layer" — it consumes frozen read models and NEVER mutates user
 * data or bypasses approval.
 */
import type {
  AdaptationDeps,
  AdaptationInput,
  BehavioralMetric,
  FeedbackWeights,
  HabitModel,
  Insight,
  PersonalizationPrefs,
  PersonalProfile,
  Preference,
  ProfileField,
  RoutineModel,
} from "./types";
import { learnPreferences } from "./preferences";
import { modelHabit } from "./habits";
import { discoverRoutines } from "./routines";
import { computeMetrics } from "./behavior";
import { computeFeedbackWeights } from "./feedback";
import { generateInsights } from "./insights";
import { personalization } from "./recommendations";
import { isActionable } from "./confidence";

export interface AdaptationResult {
  profile: PersonalProfile;
  preferences: Preference[];
  habits: HabitModel[];
  routines: RoutineModel[];
  metrics: BehavioralMetric[];
  insights: Insight[];
  weights: FeedbackWeights;
  personalization: PersonalizationPrefs;
}

/** Run one full adaptation cycle. Deterministic. */
export function runAdaptation(input: AdaptationInput, deps: AdaptationDeps): AdaptationResult {
  const preferences = learnPreferences(input.observations, input.now);
  const habits = input.habitSeries
    .map((h) => modelHabit(h.key, h.series, input.now))
    .filter((h): h is HabitModel => h !== null);
  const routines = discoverRoutines(input.observations, input.now);
  const metrics = computeMetrics(input.observations, input.now);
  const weights = computeFeedbackWeights(input.feedback);

  const insights = generateInsights({ preferences, habits, routines, metrics }, deps);

  const notificationPref = preferences.find((p) => p.key === "notification_style");
  const prefs = personalization({ weights, preferences, routines, notificationPref });

  const profile = buildProfile(preferences, habits, input.now);

  return {
    profile,
    preferences,
    habits,
    routines,
    metrics,
    insights,
    weights,
    personalization: prefs,
  };
}

/** Assemble a versioned Personal Profile from the strongest learned signals. */
function buildProfile(
  preferences: readonly Preference[],
  habits: readonly HabitModel[],
  now: Date,
): PersonalProfile {
  const fields: ProfileField[] = [];

  for (const p of preferences) {
    if (!p.enabled) continue;
    fields.push({
      key: p.key,
      category: p.category,
      value: p.value,
      confidence: p.confidence,
      evidence: p.evidence,
      lastUpdated: now.toISOString(),
      version: 1,
    });
  }

  // Maturity: share of fields that are actionable-confidence, scaled by breadth.
  const actionable = fields.filter((f) => isActionable(f.confidence)).length;
  const breadth = new Set(fields.map((f) => f.category)).size;
  const maturity =
    fields.length === 0
      ? 0
      : Math.round(Math.min(1, (actionable / fields.length) * (breadth / 10) * 3) * 100) / 100;

  return { fields, maturity, generatedAt: now.toISOString() };
}
