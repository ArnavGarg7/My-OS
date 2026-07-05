/**
 * @myos/core — pure domain logic (no IO, no DB, no fetch). Side-effect free and
 * unit-testable in isolation (08_Developer_Guidelines.md §1).
 *
 * Sprint 1.1 ships the empty seam only. Scheduling engine, recurrence, streaks,
 * priority scoring, budgets math, automation evaluation and the decision-insight
 * functions land from Sprint 1.2 onward (see 04 §6, 06 §7/§9, 07 roadmap).
 */
export const CORE_VERSION = "0.0.0" as const;
