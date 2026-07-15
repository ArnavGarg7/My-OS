import { PRIORITY_WEIGHT, type TaskPriority } from "./constants";

/**
 * Priority helpers (Sprint 2.5). Deterministic ranking + text parsing.
 */

/** Sort comparator: higher priority first. */
export function comparePriority(a: TaskPriority, b: TaskPriority): number {
  return PRIORITY_WEIGHT[b] - PRIORITY_WEIGHT[a];
}

/** Deterministic priority detection from free text (no AI). Returns null if none. */
export function parsePriority(text: string): TaskPriority | null {
  const t = text.toLowerCase();
  if (/\b(urgent|asap|critical|emergency)\b|!!!/.test(t)) return "urgent";
  if (/\b(high priority|important|high-priority)\b|!!/.test(t)) return "high";
  if (/\b(low priority|whenever|someday|low-priority)\b/.test(t)) return "low";
  if (/\bhigh\b/.test(t)) return "high";
  return null;
}
