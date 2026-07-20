/**
 * @myos/ai/chief — the AI Chief of Staff (Sprint 5.2). The primary interface to the deterministic
 * Personal OS: it answers "given everything happening in my life right now, what should I do next?"
 * Every module is deterministic and grounded in read models the server composer supplies; the
 * Chief owns no business logic. Cloud providers (via the Provider Policy) may rephrase; the
 * decisions themselves are reproducible, and offline resolves to the Local provider.
 */
export * from "./types";
export {
  computeConfidence,
  confidenceInputs,
  confidenceFor,
  CONFIDENCE_ORDER,
  type ConfidenceInputs,
} from "./confidence";
export {
  minutesBetween,
  bestFocusWindow,
  biggestRisk,
  topOpportunity,
  breakDue,
  isIdle,
} from "./signals";
export { buildExplanation, situationSentence, type ExplanationParts } from "./explanation";
export { nowRecommendation } from "./recommendation";
export { optimizePlan } from "./planner";
export { rescuePlan } from "./replanning";
export { morningIntelligence, preparationChecklist } from "./morning";
export { buildNightPlan, nightReview, type NightPlan, type NightReview } from "./night";
export { recommendedBreakMinutes, shouldBreak, suggestedFocusMinutes } from "./focus";
export {
  selectProvider,
  PROVIDER_POLICIES,
  type PolicyCapability,
  type PolicyDecision,
  type PolicyInputs,
} from "./provider-policy";
export { defaultProfile, refineProfile, clampProfile } from "./profile";
export { summarizeFeedback, deriveSteering, type FeedbackSummary, type Steering } from "./feedback";
export { chiefNotifications } from "./notifications";
export { runChief, runMorning, type ChiefResponse, type ChiefEngineOptions } from "./chief-engine";
export {
  chiefContextSchema,
  feedbackSchema,
  personalProfileSchema,
  entityRefSchema,
  disruptionSchema,
} from "./schemas";
