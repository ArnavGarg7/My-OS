/**
 * @myos/core/adaptation — the Adaptive Personal Intelligence Engine (Sprint 6.5, Phase 6 finale). The
 * deterministic layer that understands the USER: learns stable preferences, habits, routines, decision
 * styles and behavioral patterns from observed behavior + explicit feedback, producing a versioned,
 * confidence-scored, evidence-backed Personal Profile the Chief consumes as a READ MODEL.
 *
 * **The system adapts; it never guesses. AI never learns on its own — it explains and leverages the
 * deterministic profiles the OS generates.** Pure: no IO, no clock (time injected), no AI, no
 * randomness. Nothing here mutates user data, executes, or bypasses approval; personalization shapes
 * presentation/ordering/timing, never business logic.
 */
export * from "./types";
export { computeConfidence, bandFor, isActionable, type ConfidenceInput } from "./confidence";
export { learnPreferences } from "./preferences";
export { modelHabit } from "./habits";
export { discoverRoutines } from "./routines";
export { computeMetrics, decisionTendencies } from "./behavior";
export { computeFeedbackWeights, summarizeFeedback, recommendationQuality } from "./feedback";
export { generateInsights } from "./insights";
export { personalization } from "./recommendations";
export { SENSITIVE_CATEGORIES, defaultPolicies, effectiveMode, canAutoApply } from "./policies";
export { weeklyReview, monthlyReview } from "./reviews";
export { adaptationEvent, type AdaptationEvent, type AdaptationEventKind } from "./timeline";
export { explainPreference, confidenceCaption, type Explanation } from "./explanation";
export { runAdaptation, type AdaptationResult } from "./engine";
export {
  profileByCategory,
  actionablePreferences,
  habitsAtRisk,
  topInsights,
  preferenceFor,
  knownCategories,
} from "./selectors";
export {
  submitFeedbackSchema,
  feedbackTypeSchema,
  editPreferenceSchema,
  setPolicySchema,
  profileCategorySchema,
  learningModeSchema,
  reviewRangeSchema,
} from "./schemas";
