/**
 * Context snapshot types (Sprint 5.1, 06_AI_Architecture §4). A snapshot is a bounded, typed,
 * deterministically-serialized slice of user data with a token estimate. Builders produce snapshots
 * from already-fetched read models; the Budget Manager decides what fits. Pure types.
 */
export interface Snapshot {
  /** Builder that produced this snapshot (e.g. "today", "tasks_relevant"). */
  builder: string;
  /** The shaped data (already bounded by the builder). */
  data: unknown;
  /** Deterministic token estimate for the serialized data. */
  tokenEstimate: number;
  /** Priority for budget allocation — higher survives truncation longer. */
  priority: number;
}

/** A builder spec: name, target token budget, and priority (06_AI_Architecture §4 budget table). */
export interface BuilderSpec {
  name: string;
  budget: number;
  priority: number;
}
