/**
 * Adaptation selectors (Sprint 6.5). Pure read helpers over an AdaptationResult — the shapes the
 * server/UI consume (profile by category, actionable preferences, at-risk habits, top insights).
 * No IO, no AI.
 */
import type { AdaptationResult } from "./engine";
import type { HabitModel, Insight, Preference, ProfileCategory, ProfileField } from "./types";
import { isActionable } from "./confidence";

/** Profile fields grouped by category. */
export function profileByCategory(r: AdaptationResult): Record<string, ProfileField[]> {
  const out: Record<string, ProfileField[]> = {};
  for (const f of r.profile.fields) {
    (out[f.category] ??= []).push(f);
  }
  return out;
}

/** Preferences confident enough to act on. */
export function actionablePreferences(r: AdaptationResult): Preference[] {
  return r.preferences.filter((p) => p.enabled && isActionable(p.confidence));
}

/** Habits at risk of breaking (declining or high break probability). */
export function habitsAtRisk(r: AdaptationResult): HabitModel[] {
  return r.habits.filter((h) => h.trend === "declining" || h.breakProbability > 0.5);
}

/** The top-N insights. */
export function topInsights(r: AdaptationResult, n = 5): Insight[] {
  return r.insights.slice(0, n);
}

/** A single preference by key. */
export function preferenceFor(r: AdaptationResult, key: string): Preference | null {
  return r.preferences.find((p) => p.key === key) ?? null;
}

/** All categories that currently have at least one learned field. */
export function knownCategories(r: AdaptationResult): ProfileCategory[] {
  return [...new Set(r.profile.fields.map((f) => f.category))];
}
