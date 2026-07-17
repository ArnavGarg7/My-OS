import { attentionItems } from "./attention";
import type { AttentionItem, IntelligenceInput } from "./types";

/**
 * Priority matrix (Sprint 4.4). Arranges the attention items into an importance × urgency
 * grid for the dashboard's matrix view and for Tomorrow Studio's "tomorrow priorities". Both
 * axes are derived deterministically from the attention band — importance from how bad the
 * level is, urgency from whether the item is time-boxed. No new judgement is introduced.
 */

export type Quadrant = "do_now" | "schedule" | "delegate" | "watch";

export interface PriorityItem {
  item: AttentionItem;
  quadrant: Quadrant;
}

/** Time-boxed items (renewals, follow-ups, flashcards, streaks) are urgent by nature. */
function isUrgent(item: AttentionItem): boolean {
  return /renewal|follow-up|streak|flashcard|expiring|due/i.test(item.title);
}

function isImportant(item: AttentionItem): boolean {
  return item.level === "needs_attention" || item.level === "at_risk";
}

export function quadrantOf(item: AttentionItem): Quadrant {
  const important = isImportant(item);
  const urgent = isUrgent(item);
  if (important && urgent) return "do_now";
  if (important && !urgent) return "schedule";
  if (!important && urgent) return "delegate";
  return "watch";
}

export function priorityMatrix(input: IntelligenceInput): PriorityItem[] {
  return attentionItems(input).map((item) => ({ item, quadrant: quadrantOf(item) }));
}

/** The top N things to act on tomorrow — do-now first, then scheduled. */
export function tomorrowPriorities(input: IntelligenceInput, limit = 3): AttentionItem[] {
  const matrix = priorityMatrix(input);
  const order: Quadrant[] = ["do_now", "schedule", "delegate", "watch"];
  return matrix
    .sort((a, b) => order.indexOf(a.quadrant) - order.indexOf(b.quadrant))
    .slice(0, limit)
    .map((p) => p.item);
}

export function byQuadrant(items: PriorityItem[], quadrant: Quadrant): PriorityItem[] {
  return items.filter((p) => p.quadrant === quadrant);
}
