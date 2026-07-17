import "server-only";

/**
 * Server knowledge domain (Sprint 4.1). Bridges the pure KnowledgeEngine + derivations
 * with persistence. Knowledge coordinates existing entities; every derived view is
 * recomputed from stored rows. Extends — never replaces — the Journal Engine.
 */
export { knowledgeRouter } from "./router";
export * as knowledgeService from "./service";
export { signals as knowledgeSignals, summary as knowledgeSummary } from "./summary";
export { resurfacing as knowledgeResurfacing } from "./review";
