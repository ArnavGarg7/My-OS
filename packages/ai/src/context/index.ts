/**
 * @myos/ai/context — the Context Engine (06_AI_Architecture §4). Deterministic snapshot builders +
 * the Budget Manager that owns truncation. Builders shape read models the server fetched; nothing
 * here fetches or reasons.
 */
export type { Snapshot, BuilderSpec } from "./snapshot";
export { serializeSnapshotData } from "./serializer";
export { BUILDER_SPECS, FEATURE_PROFILES, runBuilder, buildProfile } from "./builders";
export { allocateBudget, type BudgetResult } from "./budget-manager";
