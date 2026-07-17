import type { Injury } from "./types";

/**
 * Injury tracking (Sprint 4.2). Pure read helpers over the injury log.
 */
export function activeInjuries(injuries: Injury[]): Injury[] {
  return injuries.filter((i) => i.status === "active" || i.status === "recovering");
}

/** Aggregate injury burden (0..100) from active injuries' severity. */
export function injuryBurden(injuries: Injury[]): number {
  const active = activeInjuries(injuries);
  if (active.length === 0) return 0;
  const total = active.reduce((n, i) => n + i.severity, 0);
  // 1 severe injury (5) ≈ 60; scaled, capped at 100.
  return Math.min(100, total * 12);
}

export function healedInjuries(injuries: Injury[]): Injury[] {
  return injuries.filter((i) => i.status === "healed");
}
