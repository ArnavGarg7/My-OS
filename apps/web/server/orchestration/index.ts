import "server-only";

/**
 * Server orchestration domain (Sprint 3.5). The bridge between the pure
 * OrchestrationEngine and persistence + the real module services. Orchestration
 * coordinates existing services; it owns no feature logic.
 */
export { orchestrationRouter } from "./router";
export * as orchestrationService from "./service";
export { orchestrationSignals } from "./signals";
export {
  summary as orchestrationSummaryStats,
  statistics as orchestrationStatistics,
} from "./summary";
