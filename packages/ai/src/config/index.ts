/**
 * @myos/ai/config — the platform's tunable knobs, all pure data. Model catalogue, capability
 * routes, cost model, and defaults. Changing a model id or tier route here re-points every
 * consumer without touching code (06_AI_Architecture §2).
 */
export * from "./models";
export * from "./capabilities";
export * from "./costs";
export * from "./defaults";
