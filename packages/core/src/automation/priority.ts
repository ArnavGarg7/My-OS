import { PRIORITY_RANK, type AutomationPriority } from "./constants";
import type { AutomationRule } from "./types";

/**
 * Automation priority ordering (Sprint 3.4). When several rules match one trigger,
 * higher priority runs first; ties break by name for a stable, deterministic order.
 */
export function comparePriority(a: AutomationPriority, b: AutomationPriority): number {
  return PRIORITY_RANK[b] - PRIORITY_RANK[a];
}

export function orderByPriority(rules: AutomationRule[]): AutomationRule[] {
  return [...rules].sort((a, b) => {
    const p = comparePriority(a.priority, b.priority);
    if (p !== 0) return p;
    return a.name.localeCompare(b.name);
  });
}
