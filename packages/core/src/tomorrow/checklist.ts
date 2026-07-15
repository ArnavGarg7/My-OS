import { DEFAULT_CHECKLIST } from "./constants";
import type { ChecklistItem, ChecklistProgress } from "./types";

/**
 * Evening checklist engine (Sprint 3.1). A static, user-configurable template
 * with deterministic completion tracking. Required items gate finalisation.
 */
export function defaultChecklist(): ChecklistItem[] {
  return DEFAULT_CHECKLIST.map((c, i) => ({
    id: `chk_${i}`,
    item: c.item,
    completed: false,
    required: c.required,
  }));
}

export function checklistProgress(items: ChecklistItem[]): ChecklistProgress {
  const completed = items.filter((i) => i.completed).length;
  const requiredRemaining = items.filter((i) => i.required && !i.completed).length;
  return {
    items,
    completed,
    total: items.length,
    requiredRemaining,
    percent: items.length ? Math.round((completed / items.length) * 100) : 0,
    allRequiredDone: requiredRemaining === 0,
  };
}

export function toggleItem(
  items: ChecklistItem[],
  id: string,
  completed: boolean,
): ChecklistItem[] {
  return items.map((i) => (i.id === id ? { ...i, completed } : i));
}
