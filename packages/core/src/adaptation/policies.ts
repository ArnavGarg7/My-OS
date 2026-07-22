/**
 * Adaptation Policies (Sprint 6.5, spec §Adaptation Policies). Per-category learning modes control
 * whether a learned value is applied manually, only suggested, or applied automatically (non-sensitive
 * preferences only). Sensitive categories can NEVER be automatic. Every learned preference can be
 * disabled. Pure — no AI, no IO.
 */
import type { AdaptationPolicy, LearningMode, ProfileCategory } from "./types";

/** Categories that must never learn automatically (require explicit user confirmation). */
export const SENSITIVE_CATEGORIES: readonly ProfileCategory[] = [
  "health",
  "communication",
  "decision_style",
];

/** The default policy per category (sensitive → suggested, else automatic). */
export function defaultPolicies(): AdaptationPolicy[] {
  const cats: ProfileCategory[] = [
    "productivity",
    "learning",
    "health",
    "meetings",
    "focus",
    "planning",
    "communication",
    "automation",
    "notifications",
    "decision_style",
  ];
  return cats.map((category) => ({
    category,
    mode: SENSITIVE_CATEGORIES.includes(category) ? "suggested" : "automatic",
  }));
}

/** The effective mode for a category, clamping sensitive categories away from `automatic`. */
export function effectiveMode(category: ProfileCategory, requested: LearningMode): LearningMode {
  if (requested === "automatic" && SENSITIVE_CATEGORIES.includes(category)) return "suggested";
  return requested;
}

/** Whether a learned value in this category may be applied without asking. */
export function canAutoApply(
  category: ProfileCategory,
  policies: readonly AdaptationPolicy[],
): boolean {
  const p = policies.find((x) => x.category === category);
  const mode = p ? effectiveMode(category, p.mode) : "suggested";
  return mode === "automatic";
}
