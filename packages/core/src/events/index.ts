/**
 * @myos/core/events — the Event Intelligence Engine (Sprint 6.1, Phase 6). A pure, deterministic
 * layer that turns environment changes into ranked, explainable, immutable Signals for the Chief.
 * It observes and informs; it NEVER mutates user data, ranks with AI, or triggers automations.
 *
 *   DomainEvent → generate → detect(risk/opportunity) → aggregate → suppress → rank → notify
 */
export * from "./types";
export * from "./constants";
export {
  createEventBus,
  publish,
  publishAll,
  eventsFrom,
  eventsOfKind,
  drain,
  type EventBus,
} from "./event-bus";
export {
  generateSignal,
  generateSignals,
  KNOWN_EVENT_KINDS,
  type GeneratorDeps,
} from "./generator";
export { rankSignal, rankSignals, withRanking } from "./ranking";
export { detectRisks, type RiskContext, type DetectDeps } from "./risk";
export { detectOpportunities, type OpportunityContext } from "./opportunity";
export { aggregateSignals, type AggregateDeps } from "./aggregation";
export { suppressSignals, isExpired, type SuppressResult } from "./suppression";
export { levelForPriority, decideNotification } from "./notifications";
export { windowForTime, signalsInWindow, groupByWindow } from "./context-window";
export { renderExplanation, signalHeadline, chiefBrief } from "./explanation";
export { runEngine, type EngineInput, type EngineDeps, type EngineResult } from "./engine";
export {
  currentSignals,
  todaySignals,
  riskSignals,
  opportunitySignals,
  notifiableSignals,
  chiefInput,
  signalCounts,
} from "./selectors";
export {
  eventSourceSchema,
  domainEventSchema,
  signalCategorySchema,
  contextWindowSchema,
  signalSubscriptionSchema,
  type SignalSubscription,
} from "./schemas";
