import "server-only";

/**
 * Server resource domain (Sprint 4.3). Bridges the pure Resource & Relationship platform
 * with persistence. Extends — never replaces — Finance (2.11): the ONE meeting point is
 * `bridge.ts`, which reads Finance's own derived balances and classifies them into cash +
 * liabilities. No Finance number is recomputed anywhere in this domain.
 *
 * Every derived view (portfolio/net worth/allocation/depreciation/relationship strength/
 * forecast/statistics/signals) recomputes from stored rows on read.
 *
 * AI-integration seams: summary(), signals(), portfolio(), search(), timeline.
 */
export { resourceRouter } from "./router";
export * as resourceService from "./service";
export { signals as resourceSignals, summary as resourceSummary } from "./summary";
export { portfolio as resourcePortfolio } from "./portfolio";
export { financeBridge } from "./bridge";
export { upcomingMaintenance as resourceUpcomingMaintenance } from "./maintenance";
export {
  birthdays as resourceBirthdays,
  health as resourceRelationshipHealth,
} from "./relationships";
